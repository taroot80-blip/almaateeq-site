package com.almaateeq.site;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

/**
 * يعرض الموقع الحي almaateeq-site.vercel.app، فكل تحديث يُنشر على الموقع
 * يظهر في التطبيق تلقائيًا دون إصدار جديد. عند انقطاع الإنترنت يعرض آخر
 * ما حُفظ من الصفحات، وإن لم يوجد شيء محفوظ يعرض صفحة «لا يوجد اتصال».
 */
public class MainActivity extends Activity {
    static final String HOST = "almaateeq-site.vercel.app";
    static final String HOME = "https://" + HOST + "/";
    static final String OFFLINE = "file:///android_asset/offline.html";
    /** إذا غاب المستخدم عن التطبيق أكثر من هذا يُعاد تحميل الصفحة لجلب الجديد. */
    static final long REFRESH_AFTER_MS = 30 * 60 * 1000L;

    private FrameLayout root;
    private WebView web;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;
    private long pausedAt = 0;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF0B0805);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B0805);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        // أندرويد 15 فما فوق يرسم تحت أشرطة النظام، فنُبعد المحتوى عنها
        web.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                l = i.left; t = i.top; r = i.right; b = i.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(l, t, r, b);
            return insets;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " AlmaateeqApp/1.0");
        CookieManager.getInstance().setAcceptCookie(true);
        applyCacheMode();

        web.addJavascriptInterface(new Bridge(), "AndroidApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                String scheme = u.getScheme();
                if ("file".equals(scheme)) return false;
                if ("https".equals(scheme) && HOST.equalsIgnoreCase(u.getHost())) return false;
                openOutside(u);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame() && !OFFLINE.equals(view.getUrl())) {
                    view.loadUrl(OFFLINE);
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                if (fullView != null) { cb.onCustomViewHidden(); return; }
                fullView = view;
                fullCallback = cb;
                root.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                setFullscreenBars(true);
            }

            @Override
            public void onHideCustomView() {
                exitFullscreen();
            }
        });

        // أزرار «نزّل الآن» في الموقع تُحفظ في مجلد التنزيلات
        web.setDownloadListener((url, ua, disposition, mime, length) -> {
            try {
                String name = URLUtil.guessFileName(url, disposition, mime);
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                r.setMimeType(mime);
                r.addRequestHeader("User-Agent", ua);
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) r.addRequestHeader("Cookie", cookie);
                r.setTitle(name);
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                dm.enqueue(r);
                Toast.makeText(this, "جارٍ تنزيل «" + name + "» إلى التنزيلات", Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                openOutside(Uri.parse(url));
            }
        });

        if (state != null) {
            web.restoreState(state);
        } else {
            Uri data = getIntent() != null ? getIntent().getData() : null;
            web.loadUrl(data != null && HOST.equalsIgnoreCase(data.getHost()) ? data.toString() : HOME);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri data = intent.getData();
        if (data != null && HOST.equalsIgnoreCase(data.getHost())) web.loadUrl(data.toString());
    }

    @Override
    protected void onPause() {
        super.onPause();
        pausedAt = SystemClock.elapsedRealtime();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        applyCacheMode();
        // بعد غياب طويل يُعاد التحميل ليظهر آخر ما نُشر على الموقع
        if (pausedAt > 0 && SystemClock.elapsedRealtime() - pausedAt > REFRESH_AFTER_MS && isOnline()) {
            String u = web.getUrl();
            if (u == null || OFFLINE.equals(u)) web.loadUrl(HOME); else web.reload();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (fullView != null) { exitFullscreen(); return; }
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    private void exitFullscreen() {
        if (fullView == null) return;
        root.removeView(fullView);
        fullView = null;
        if (fullCallback != null) fullCallback.onCustomViewHidden();
        fullCallback = null;
        setFullscreenBars(false);
    }

    private void setFullscreenBars(boolean on) {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c == null) return;
            if (on) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            } else {
                c.show(WindowInsets.Type.systemBars());
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(on
                    ? View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    : View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    private void applyCacheMode() {
        // مع الاتصال: يتحقق من الموقع في كل مرة فيظهر الجديد. دونه: يعرض المحفوظ
        web.getSettings().setCacheMode(isOnline() ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return true;
        Network n = cm.getActiveNetwork();
        if (n == null) return false;
        NetworkCapabilities c = cm.getNetworkCapabilities(n);
        return c != null && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void openOutside(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "لا يوجد تطبيق يفتح هذا الرابط", Toast.LENGTH_SHORT).show();
        }
    }

    /** ما تستدعيه صفحة «لا يوجد اتصال». */
    private class Bridge {
        @JavascriptInterface
        public void retry() {
            runOnUiThread(() -> {
                applyCacheMode();
                web.loadUrl(HOME);
            });
        }
    }
}
