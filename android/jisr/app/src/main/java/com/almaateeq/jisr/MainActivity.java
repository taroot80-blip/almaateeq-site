package com.almaateeq.jisr;

import android.app.Activity;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONObject;

// جسر العطاء: تطبيق هاتف عمودي، يفتح نسخة الموقع مع الإنترنت (آخر تحديث دائمًا)، والنسخة المدمجة بلا إنترنت
public class MainActivity extends Activity {
  private static final String LIVE = "https://www.almaateeq.com/apps/jisr/?open";  // المنصة الحقيقية على الخادم
  private static final String LOCAL = "file:///android_asset/offline.html";  // شاشة «لا يوجد اتصال» بدل نسخة تجريبية
  private static final int PICK = 7;
  private WebView web;
  private ValueCallback<Uri[]> pending;
  private Uri cameraUri;
  private boolean fellBack = false;
  private boolean loaded = false;
  private String shareImgs = null, shareText = null;   // ما شاركه العضو من واتساب إلى التطبيق

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
      @Override public void onPageFinished(WebView v, String url) { loaded = true; deliverShare(); }
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
    web.addJavascriptInterface(new Bridge(), "JisrAndroid");
    web.loadUrl(online() ? LIVE : LOCAL);
    takeShare(getIntent());
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

  // جسر طابور النشر: يرسل نص الإعلان وصوره إلى واتساب مباشرة (الصفحة داخل التطبيق لا تستطيع مشاركة الصور وحدها)
  private class Bridge {
    @JavascriptInterface public boolean canShareFiles() { return true; }
    /* أي واتساب تُرسل إليه الإعلانات: business (واتساب الأعمال) أو normal (العادي) أو ask (يسأل كل مرة) */
    @JavascriptInterface public void setWaApp(String which) { getSharedPreferences("jisr", MODE_PRIVATE).edit().putString("wa", which).apply(); }
    @JavascriptInterface public String getWaApp() { return waApp(); }
    /* فتح رابط واتساب (المجموعة أو محادثة) في الواتساب المختار */
    @JavascriptInterface public void openUrl(final String url) {
      runOnUiThread(() -> {
        Intent it = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        for (String pkg : order()) { try { Intent t = new Intent(it); t.setPackage(pkg); startActivity(t); return; } catch (Exception e) {} }
        try { startActivity(Intent.createChooser(it, "افتح في واتساب")); } catch (Exception e) {}
      });
    }
    /* طباعة الإحصاء أو حفظه PDF عبر نظام الطباعة في أندرويد (يطبع منطقة التقرير بقواعد @media print) */
    @JavascriptInterface public void print(final String title) {
      runOnUiThread(() -> {
        try {
          android.print.PrintManager pm = (android.print.PrintManager) getSystemService(Context.PRINT_SERVICE);
          android.print.PrintAttributes at = new android.print.PrintAttributes.Builder().setMediaSize(android.print.PrintAttributes.MediaSize.ISO_A4).build();
          pm.print(title, web.createPrintDocumentAdapter(title), at);
        } catch (Exception e) {}
      });
    }
    @JavascriptInterface public void share(final String text, final String urlsJson) {
      new Thread(() -> {
        final ArrayList<Uri> uris = new ArrayList<>();
        try {
          JSONArray a = new JSONArray(urlsJson);
          File dir = new File(getCacheDir(), "shots"); dir.mkdirs();
          for (int i = 0; i < a.length() && i < 3; i++) {
            byte[] data = read(a.getString(i));
            if (data == null) continue;
            File f = new File(dir, "share_" + System.currentTimeMillis() + "_" + i + ".jpg");
            try (FileOutputStream o = new FileOutputStream(f)) { o.write(data); }
            uris.add(FileProvider.getUriForFile(MainActivity.this, "com.almaateeq.jisr.files", f));
          }
        } catch (Exception e) { /* إن تعذرت الصور يُرسل النص وحده */ }
        runOnUiThread(() -> send(text, uris));
      }).start();
    }
  }

  private byte[] read(String u) {
    try {
      if (u.startsWith("data:")) return Base64.decode(u.substring(u.indexOf(',') + 1), Base64.DEFAULT);
      InputStream in;
      if (u.startsWith("file:///android_asset/")) in = getAssets().open(u.substring("file:///android_asset/".length()));
      else {
        HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
        c.setConnectTimeout(10000); c.setReadTimeout(15000);
        in = c.getInputStream();
      }
      try (InputStream is = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
        byte[] buf = new byte[16384]; int n;
        while ((n = is.read(buf)) > 0) out.write(buf, 0, n);
        return out.toByteArray();
      }
    } catch (Exception e) { return null; }
  }

  private void send(String text, ArrayList<Uri> uris) {
    Intent it;
    if (uris.isEmpty()) { it = new Intent(Intent.ACTION_SEND); it.setType("text/plain"); }
    else if (uris.size() == 1) { it = new Intent(Intent.ACTION_SEND); it.setType("image/*"); it.putExtra(Intent.EXTRA_STREAM, uris.get(0)); }
    else { it = new Intent(Intent.ACTION_SEND_MULTIPLE); it.setType("image/*"); it.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris); }
    it.putExtra(Intent.EXTRA_TEXT, text);
    if (!uris.isEmpty()) {
      ClipData clip = ClipData.newRawUri("", uris.get(0));
      for (int i = 1; i < uris.size(); i++) clip.addItem(new ClipData.Item(uris.get(i)));
      it.setClipData(clip);
      it.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }
    // الواتساب المختار أولًا، ثم الآخر، وإلا قائمة المشاركة
    for (String pkg : order()) {
      try { Intent t = new Intent(it); t.setPackage(pkg); startActivity(t); return; } catch (Exception e) {}
    }
    try { startActivity(Intent.createChooser(it, "انشر في واتساب")); } catch (Exception e) {}
  }

  private String waApp() { return getSharedPreferences("jisr", MODE_PRIVATE).getString("wa", "business"); }
  private String[] order() {
    String w = waApp();
    if ("ask".equals(w)) return new String[0];
    return "normal".equals(w) ? new String[]{"com.whatsapp", "com.whatsapp.w4b"} : new String[]{"com.whatsapp.w4b", "com.whatsapp"};
  }

  /* استقبال صورة أو نص من واتساب (مشاركة ← جسر العطاء) */
  @Override protected void onNewIntent(Intent i) { super.onNewIntent(i); setIntent(i); takeShare(i); }
  private void takeShare(Intent i) {
    if (i == null) return;
    String a = i.getAction();
    if (!Intent.ACTION_SEND.equals(a) && !Intent.ACTION_SEND_MULTIPLE.equals(a)) return;
    ArrayList<Uri> uris = new ArrayList<>();
    try {
      if (Intent.ACTION_SEND_MULTIPLE.equals(a)) { ArrayList<Uri> l = i.getParcelableArrayListExtra(Intent.EXTRA_STREAM); if (l != null) uris.addAll(l); }
      else { Uri u = i.getParcelableExtra(Intent.EXTRA_STREAM); if (u != null) uris.add(u); }
    } catch (Exception e) {}
    JSONArray arr = new JSONArray();
    for (Uri u : uris) { if (arr.length() >= 3) break; String d = shrink(u); if (d != null) arr.put(d); }
    shareImgs = arr.toString();
    CharSequence t = i.getCharSequenceExtra(Intent.EXTRA_TEXT);
    shareText = t == null ? "" : t.toString();
    deliverShare();
  }
  private String shrink(Uri u) {
    try {
      BitmapFactory.Options o = new BitmapFactory.Options(); o.inJustDecodeBounds = true;
      InputStream in = getContentResolver().openInputStream(u); BitmapFactory.decodeStream(in, null, o); in.close();
      int sample = 1; while (Math.max(o.outWidth, o.outHeight) / sample > 1800) sample *= 2;
      BitmapFactory.Options o2 = new BitmapFactory.Options(); o2.inSampleSize = sample;
      in = getContentResolver().openInputStream(u); Bitmap b = BitmapFactory.decodeStream(in, null, o2); in.close();
      if (b == null) return null;
      float k = Math.min(1f, 900f / Math.max(b.getWidth(), b.getHeight()));
      if (k < 1f) b = Bitmap.createScaledBitmap(b, Math.round(b.getWidth() * k), Math.round(b.getHeight() * k), true);
      ByteArrayOutputStream out = new ByteArrayOutputStream(); b.compress(Bitmap.CompressFormat.JPEG, 80, out);
      return "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    } catch (Exception e) { return null; }
  }
  private void deliverShare() {
    if (!loaded || shareImgs == null || web == null) return;
    final String js = "window.jisrShared && window.jisrShared(" + shareImgs + "," + JSONObject.quote(shareText) + ")";
    shareImgs = null; shareText = null;
    web.postDelayed(() -> web.evaluateJavascript(js, null), 900);
  }

  @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
