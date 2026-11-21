package com.almaateeq.jubail;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import java.io.File;

// مسابقة رحلة الجبيل: تفتح نسخة الموقع مع الإنترنت (كل الميزات)، والنسخة المدمجة بلا إنترنت
public class MainActivity extends Activity {
  private static final String LIVE = "https://www.almaateeq.com/apps/jubail/";
  private static final String LOCAL = "file:///android_asset/index.html";
  private static final int PICK = 7;
  private WebView web;
  private ValueCallback<Uri[]> pending;
  private Uri cameraUri;
  private boolean fellBack = false;

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web = new WebView(this);
    setContentView(web);
    hideBars();
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    web.setWebViewClient(new WebViewClient() {
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame() && !fellBack) { fellBack = true; v.loadUrl(LOCAL); }
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (pending != null) pending.onReceiveValue(null);
        pending = cb;
        Intent content = p.createIntent();
        content.setType("image/*");
        Intent cam = null;
        try {
          File dir = new File(getCacheDir(), "shots"); dir.mkdirs();
          File f = new File(dir, "shot_" + System.currentTimeMillis() + ".jpg");
          cameraUri = FileProvider.getUriForFile(MainActivity.this, "com.almaateeq.jubail.files", f);
          cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
          cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
          cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ex) { cameraUri = null; }
        Intent chooser;
        if (p.isCaptureEnabled() && cam != null) chooser = cam;
        else { chooser = Intent.createChooser(content, "اختر صورة"); if (cam != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam}); }
        try { startActivityForResult(chooser, PICK); } catch (Exception ex) { pending.onReceiveValue(null); pending = null; return false; }
        return true;
      }
    });
    web.loadUrl(online() ? LIVE : LOCAL);
  }

  private boolean online() {
    try {
      ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
      NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
      return nc != null && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    } catch (Exception e) { return false; }
  }

  @Override protected void onActivityResult(int req, int res, Intent data) {
    super.onActivityResult(req, res, data);
    if (req != PICK || pending == null) return;
    Uri[] out = null;
    if (res == RESULT_OK) {
      if (data != null && data.getData() != null) out = new Uri[]{data.getData()};
      else if (cameraUri != null) out = new Uri[]{cameraUri};
    }
    pending.onReceiveValue(out);
    pending = null;
  }

  private void hideBars() {
    web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }

  @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) hideBars(); }

  @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
