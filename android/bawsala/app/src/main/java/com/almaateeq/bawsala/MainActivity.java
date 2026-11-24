package com.almaateeq.bawsala;

import android.app.Activity;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.speech.RecognizerIntent;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import org.json.JSONObject;

// البوصلة السلوكية: يفتح نسخة الموقع فيظهر آخر تحديث دائمًا.
// وبلا إنترنت يقدّم النسخة المدمجة على العنوان نفسه، فتبقى البيانات المحفوظة واحدة في الحالين.
public class MainActivity extends Activity {
  private static final String HOST = "https://www.almaateeq.com";
  private static final String PATH = "/apps/bawsala/";
  private static final String LIVE = HOST + PATH;
  private static final int PICK = 7, SPEAK = 8;
  private WebView web, printer;
  private ValueCallback<Uri[]> pending;
  private boolean offline = false;

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().setStatusBarColor(Color.parseColor("#0E8F8F"));
    getWindow().setNavigationBarColor(Color.parseColor("#FFFFFF"));
    web = new WebView(this);
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    s.setTextZoom(100);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    offline = !online();
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        String u = r.getUrl().toString();
        if (u.startsWith(LIVE)) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception e) {}
        return true;
      }
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        String u = r.getUrl().toString();
        boolean page = u.equals(LIVE) || u.startsWith(LIVE + "index.html") || u.startsWith(LIVE + "?") || u.startsWith(LIVE + "#");
        if (offline && page) return asset();
        return null;
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame() && !offline) { offline = true; v.loadUrl(LIVE); }
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (pending != null) pending.onReceiveValue(null);
        pending = cb;
        String[] acc = p.getAcceptTypes();
        String type = (acc != null && acc.length > 0 && acc[0] != null && acc[0].startsWith("image")) ? "image/*" : "*/*";
        Intent content = new Intent(Intent.ACTION_GET_CONTENT);
        content.addCategory(Intent.CATEGORY_OPENABLE);
        content.setType(type);
        try { startActivityForResult(Intent.createChooser(content, "اختر الملف"), PICK); }
        catch (Exception ex) { pending.onReceiveValue(null); pending = null; return false; }
        return true;
      }
    });
    web.addJavascriptInterface(new Bridge(), "BawsalaAndroid");
    web.loadUrl(LIVE);
  }

  private WebResourceResponse asset() {
    try {
      InputStream in = getAssets().open("index.html");
      return new WebResourceResponse("text/html", "utf-8", in);
    } catch (Exception e) { return null; }
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
    if (req == SPEAK) {
      String t = "";
      if (res == RESULT_OK && data != null) {
        ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (r != null && !r.isEmpty()) t = r.get(0);
      }
      web.evaluateJavascript("window.__bawsalaSpeech&&window.__bawsalaSpeech(" + JSONObject.quote(t) + ")", null);
      return;
    }
    if (req != PICK || pending == null) return;
    Uri[] out = null;
    if (res == RESULT_OK && data != null && data.getData() != null) out = new Uri[]{data.getData()};
    pending.onReceiveValue(out);
    pending = null;
  }

  private File cacheFile(String name, String content) throws Exception {
    File dir = new File(getCacheDir(), "shots"); dir.mkdirs();
    File f = new File(dir, name.replaceAll("[\\\\/:*?\"<>|]", "-"));
    try (FileOutputStream o = new FileOutputStream(f)) { o.write(content.getBytes(StandardCharsets.UTF_8)); }
    return f;
  }

  private void toast(String m) { runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show()); }

  private class Bridge {
    /* طباعة النموذج أو حفظه PDF من نظام الطباعة في أندرويد */
    @JavascriptInterface public void printHtml(final String title, final String html) {
      runOnUiThread(() -> {
        printer = new WebView(MainActivity.this);
        printer.getSettings().setJavaScriptEnabled(false);
        printer.setWebViewClient(new WebViewClient() {
          @Override public void onPageFinished(WebView v, String url) {
            try {
              PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
              PrintAttributes at = new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build();
              pm.print(title, v.createPrintDocumentAdapter(title), at);
            } catch (Exception e) { toast("تعذّرت الطباعة"); }
          }
        });
        printer.loadDataWithBaseURL(LIVE, html, "text/html", "utf-8", null);
      });
    }
    /* إرسال الملف إلى واتساب أو البريد أو Teams */
    @JavascriptInterface public void shareFile(final String name, final String content, final String mime) {
      runOnUiThread(() -> {
        try {
          Uri u = FileProvider.getUriForFile(MainActivity.this, "com.almaateeq.bawsala.files", cacheFile(name, content));
          Intent it = new Intent(Intent.ACTION_SEND);
          it.setType(mime == null || mime.isEmpty() ? "text/html" : mime);
          it.putExtra(Intent.EXTRA_STREAM, u);
          it.putExtra(Intent.EXTRA_SUBJECT, name);
          it.setClipData(ClipData.newRawUri("", u));
          it.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
          startActivity(Intent.createChooser(it, "أرسل الملف"));
        } catch (Exception e) { toast("تعذّر الإرسال"); }
      });
    }
    /* حفظ الملف في مجلد التنزيلات (النسخة الاحتياطية وملفات الطباعة) */
    @JavascriptInterface public void saveFile(final String name, final String content, final String mime) {
      runOnUiThread(() -> {
        if (Build.VERSION.SDK_INT >= 29) {
          try {
            ContentValues cv = new ContentValues();
            cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
            cv.put(MediaStore.Downloads.MIME_TYPE, mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
            cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/البوصلة السلوكية");
            Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
            try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(content.getBytes(StandardCharsets.UTF_8)); }
            toast("حُفظ في التنزيلات ← البوصلة السلوكية: " + name);
            return;
          } catch (Exception e) { /* يُرسل بدل الحفظ */ }
        }
        shareFile(name, content, mime);
      });
    }
    /* الكتابة بالصوت بالعربية */
    @JavascriptInterface public void listen() {
      runOnUiThread(() -> {
        try {
          Intent it = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
          it.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
          it.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-KW");
          it.putExtra(RecognizerIntent.EXTRA_PROMPT, "تحدّث الآن");
          startActivityForResult(it, SPEAK);
        } catch (Exception e) {
          toast("الكتابة بالصوت تحتاج تطبيق Google");
          web.evaluateJavascript("window.__bawsalaSpeech&&window.__bawsalaSpeech('')", null);
        }
      });
    }
  }

  @Override public void onBackPressed() {
    web.evaluateJavascript("(function(){var v=document.getElementById('veil');if(v&&v.classList.contains('on')){v.classList.remove('on');return 1}return 0})()",
      r -> { if (!"1".equals(r)) { if (web.canGoBack()) web.goBack(); else MainActivity.super.onBackPressed(); } });
  }
}
