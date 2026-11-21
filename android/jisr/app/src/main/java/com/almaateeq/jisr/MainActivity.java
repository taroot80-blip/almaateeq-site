package com.almaateeq.jisr;

import android.app.Activity;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import java.io.File;

// جسر العطاء: تطبيق هاتف عمودي، يفتح نسخة الموقع مع الإنترنت (آخر تحديث دائمًا)، والنسخة المدمجة بلا إنترنت
public class MainActivity extends Activity {
  private static final String LIVE = "https://www.almaateeq.com/apps/jisr/";
  private static final String LOCAL = "file:///android_asset/index.html";
  private static final int PICK = 7;
  private WebView web;
  private ValueCallback<Uri[]> pending;
  private Uri cameraUri;
  private boolean fellBack = false;

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().setStatusBarColor(Color.parseColor("#2D5530"));
    getWindow().setNavigationBarColor(Color.parseColor("#F5F3EC"));
    web = new WebView(this);
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowFileAccess(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    s.setTextZoom(100);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        String u = r.getUrl().toString();
        if (u.startsWith("https://www.almaateeq.com/apps/jisr") || u.startsWith("file:")) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception e) {}
        return true; // واتساب والروابط الخارجية تفتح في تطبيقاتها
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame() && !fellBack) { fellBack = true; v.loadUrl(LOCAL); }
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (pending != null) pending.onReceiveValue(null);
        pending = cb;
        Intent content = new Intent(Intent.ACTION_GET_CONTENT);
        content.addCategory(Intent.CATEGORY_OPENABLE);
        content.setType("image/*");
        content.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
        Intent cam = null;
        try {
          File dir = new File(getCacheDir(), "shots"); dir.mkdirs();
          File f = new File(dir, "shot_" + System.currentTimeMillis() + ".jpg");
          cameraUri = FileProvider.getUriForFile(MainActivity.this, "com.almaateeq.jisr.files", f);
          cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
          cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
          cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ex) { cameraUri = null; }
        Intent chooser = Intent.createChooser(content, "صوّر الغرض أو اختر صوره");
        if (cam != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
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
      if (data != null && data.getClipData() != null) {
        ClipData c = data.getClipData();
        int n = Math.min(c.getItemCount(), 3);
        out = new Uri[n];
        for (int i = 0; i < n; i++) out[i] = c.getItemAt(i).getUri();
      } else if (data != null && data.getData() != null) out = new Uri[]{data.getData()};
      else if (cameraUri != null) out = new Uri[]{cameraUri};
    }
    pending.onReceiveValue(out);
    pending = null;
  }

  @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
