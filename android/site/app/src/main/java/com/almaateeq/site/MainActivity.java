package com.almaateeq.site;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * موقع المعاتيق: يفتح النسخة الحية من الموقع دائمًا، فيصل كل تحديث
 * للموقع إلى التطبيق دون إعادة تثبيت. وإن انقطع الإنترنت فتحت النسخة المحفوظة
 * داخل التطبيق. والروابط الخارجية (يوتيوب، المكتبات) تفتح في تطبيقاتها.
 */
public class MainActivity extends Activity {
    static final String LIVE = "https://www.almaateeq.com/";
    static final String LOCAL = "file:///android_asset/www/index.html";
    WebView web;
    boolean fellBack = false;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#140d07"));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String host = u.getHost() == null ? "" : u.getHost();
                String sc = u.getScheme() == null ? "" : u.getScheme();
                if (sc.equals("file") || host.endsWith("almaateeq.com") || host.endsWith("vercel.app")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame() && !fellBack) { fellBack = true; v.loadUrl(LOCAL); }
            }
        });
        // ملفات التنزيل (الألعاب والتطبيقات) تفتح في المتصفح ليحفظها
        web.setDownloadListener((url, ua, cd, mime, len) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { }
        });
        if (b != null) web.restoreState(b); else web.loadUrl(LIVE);
    }

    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
