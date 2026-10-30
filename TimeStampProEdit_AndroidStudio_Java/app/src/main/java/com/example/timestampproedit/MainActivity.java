package com.example.timestampproedit;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.hardware.Camera;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.media.CamcorderProfile;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

@SuppressWarnings("deprecation")
public class MainActivity extends Activity implements SurfaceHolder.Callback {

    // Color Palette: DARK NEON PREMIUM
    private final int PRIMARY = Color.parseColor("#00F0FF");      // Neon Cyan
    private final int SECONDARY = Color.parseColor("#8B5CF6");    // Neon Purple
    private final int BACKGROUND = Color.parseColor("#090E17");   // Space Dark Blue
    private final int SURFACE = Color.parseColor("#151C2C");      // Dark Card
    private final int TEXT_DARK = Color.parseColor("#FFFFFF");    // White Text
    private final int TEXT_MUTED = Color.parseColor("#94A3B8");   // Slate 400
    private final int BORDER = Color.parseColor("#2A344A");       // Line Border
    private final int ACCENT = Color.parseColor("#1E293B");       // Dark Accent

    private LinearLayout body;

    private Bitmap selectedBitmap;
    private Bitmap stampedBitmap;

    private final int PICK_IMAGE = 21;
    private final int TAKE_PHOTO = 22;
    private final int CAMERA_PERMISSION_CODE = 1001;
    private final int LOCATION_PERMISSION_CODE = 1002;

    private Uri cameraPhotoUri;
    private File cameraPhotoFile;

    private String stampDate = "";
    private String stampTime = "";
    private String location = "Kecamatan Pulo Gadung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta";
    private String note = "5 Blok B";
    private String colorName = "Putih";
    private String stampPosition = "Bawah Kanan"; // Default POJOK KANAN BAWAH

    private int activeTab = 0; // 0: Home, 1: Editor, 2: History, 3: Profile, 4: Camera

    // Realtime Camera Surface and Views
    private Camera mCamera;
    private SurfaceHolder cameraSurfaceHolder;
    private boolean isPreviewRunning = false;
    private int currentCameraId = Camera.CameraInfo.CAMERA_FACING_BACK;
    private boolean isFlashOn = false;

    // Video Recording Variables
    private MediaRecorder mMediaRecorder;
    private boolean isRecordingVideo = false;
    private boolean isVideoMode = false;
    private File videoFile;
    private int videoSeconds = 0;
    private final Handler recordHandler = new Handler(Looper.getMainLooper());
    private Runnable recordRunnable;
    private TextView shutterBtn;

    private TextView liveTimeText;
    private TextView liveNoteText;
    private TextView liveLocationText;

    private final Handler timerHandler = new Handler(Looper.getMainLooper());
    private final Runnable timerRunnable = new Runnable() {
        @Override
        public void run() {
            updateRealtimeClock();
            timerHandler.postDelayed(this, 1000);
        }
    };

    private static class StampHistoryItem {
        Bitmap bitmap;
        Uri videoUri;
        boolean isVideo;
        String dateTime;
        String location;
        String note;

        StampHistoryItem(Bitmap bitmap, String dateTime, String location) {
            this.bitmap = bitmap;
            this.isVideo = false;
            this.dateTime = dateTime;
            this.location = location;
            this.note = "";
        }

        StampHistoryItem(Uri videoUri, String dateTime, String location, String note) {
            this.videoUri = videoUri;
            this.isVideo = true;
            this.dateTime = dateTime;
            this.location = location;
            this.note = note;
        }
    }

    private final List<StampHistoryItem> historyList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(BACKGROUND);
        getWindow().setNavigationBarColor(BACKGROUND);

        updateRealtimeClock();
        checkLocationPermission();

        showHome();
    }

    @Override
    public void onBackPressed() {
        if (isRecordingVideo) {
            stopVideoRecording();
        }
        if (activeTab != 0) {
            showHome();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        stopTimer();
        if (isRecordingVideo) {
            stopVideoRecording();
        }
        releaseCamera();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (activeTab == 4) {
            startTimer();
        }
    }

    private void startTimer() {
        timerHandler.removeCallbacks(timerRunnable);
        timerHandler.post(timerRunnable);
    }

    private void stopTimer() {
        timerHandler.removeCallbacks(timerRunnable);
    }

    private void updateRealtimeClock() {
        Calendar now = Calendar.getInstance();
        stampDate = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(now.getTime());
        stampTime = new SimpleDateFormat("HH.mm.ss", Locale.getDefault()).format(now.getTime());

        if (liveTimeText != null) {
            liveTimeText.setText(stampDate + " " + stampTime);
        }
        if (liveNoteText != null) {
            if (!note.isEmpty()) {
                liveNoteText.setText(note);
                liveNoteText.setVisibility(View.VISIBLE);
            } else {
                liveNoteText.setVisibility(View.GONE);
            }
        }
        if (liveLocationText != null) {
            String formattedLoc = location.isEmpty() ? "Lokasi GPS Realtime" : location.replace(", ", "\n");
            liveLocationText.setText(formattedLoc);
        }
    }

    private void checkLocationPermission() {
        if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{
                    android.Manifest.permission.ACCESS_FINE_LOCATION,
                    android.Manifest.permission.RECORD_AUDIO
            }, LOCATION_PERMISSION_CODE);
        } else {
            fetchCurrentLocation();
        }
    }

    private void fetchCurrentLocation() {
        try {
            LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
            if (lm != null) {
                Location loc = null;
                if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
                if (loc != null) {
                    Geocoder geocoder = new Geocoder(this, Locale.getDefault());
                    List<Address> addresses = geocoder.getFromLocation(loc.getLatitude(), loc.getLongitude(), 1);
                    if (addresses != null && !addresses.isEmpty()) {
                        Address addr = addresses.get(0);
                        String subLoc = addr.getSubLocality() != null ? addr.getSubLocality() : "";
                        String city = addr.getLocality() != null ? addr.getLocality() : addr.getAdminArea();
                        String admin = addr.getAdminArea() != null ? addr.getAdminArea() : "";

                        StringBuilder sb = new StringBuilder();
                        if (!subLoc.isEmpty()) sb.append("Kecamatan ").append(subLoc).append(", ");
                        if (!city.isEmpty()) sb.append(city).append(", ");
                        if (!admin.isEmpty()) sb.append(admin);

                        String res = sb.toString().trim();
                        if (res.endsWith(",")) res = res.substring(0, res.length() - 1);
                        if (!res.isEmpty()) location = res;
                    } else {
                        location = String.format(Locale.US, "GPS: %.4f, %.4f", loc.getLatitude(), loc.getLongitude());
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    // ==============================
    // UTILITIES UI PROGRAMMATIC
    // ==============================
    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radius));
        return drawable;
    }

    private GradientDrawable outlined(int color, int radius, int strokeColor) {
        GradientDrawable drawable = rounded(color, radius);
        drawable.setStroke(dp(1), strokeColor);
        return drawable;
    }

    private GradientDrawable gradient(int startColor, int endColor, int radius) {
        GradientDrawable drawable = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{startColor, endColor}
        );
        drawable.setCornerRadius(dp(radius));
        return drawable;
    }

    private void addRipple(View view, int idleColor, int rippleColor, int radius) {
        GradientDrawable shape = rounded(idleColor, radius);
        RippleDrawable ripple = new RippleDrawable(ColorStateList.valueOf(rippleColor), shape, null);
        view.setBackground(ripple);
    }

    private LinearLayout column() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }

    private LinearLayout row() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.setGravity(Gravity.CENTER_VERTICAL);
        return layout;
    }

    private LinearLayout.LayoutParams params(int width, int height) {
        return new LinearLayout.LayoutParams(width < 0 ? width : dp(width), height < 0 ? height : dp(height));
    }

    private void gap(LinearLayout parent, int height) {
        View view = new View(this);
        parent.addView(view, params(1, height));
    }

    private void padding(View view, int left, int top, int right, int bottom) {
        view.setPadding(dp(left), dp(top), dp(right), dp(bottom));
    }

    private TextView label(String value, int size, int color, boolean bold) {
        TextView text = new TextView(this);
        text.setText(value);
        text.setTextSize(size);
        text.setTextColor(color);
        if (bold) {
            text.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        } else {
            text.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        }
        return text;
    }

    private TextView button(String value, boolean primary, Runnable action) {
        TextView text = label(value, 15, primary ? BACKGROUND : TEXT_DARK, true);
        text.setGravity(Gravity.CENTER);
        padding(text, 20, 16, 20, 16);

        if (primary) {
            GradientDrawable grad = gradient(PRIMARY, SECONDARY, 24);
            RippleDrawable ripple = new RippleDrawable(ColorStateList.valueOf(Color.parseColor("#66FFFFFF")), grad, null);
            text.setBackground(ripple);
            text.setElevation(dp(8));
        } else {
            addRipple(text, SURFACE, ACCENT, 24);
            text.setBackground(outlined(SURFACE, 24, BORDER));
        }

        text.setClickable(true);
        text.setFocusable(true);
        text.setOnClickListener(view -> action.run());
        return text;
    }

    private void startPage(String title, String subtitle, int tabIndex) {
        activeTab = tabIndex;
        stopTimer();
        if (isRecordingVideo) stopVideoRecording();
        releaseCamera();

        FrameLayout rootContainer = new FrameLayout(this);
        rootContainer.setBackgroundColor(BACKGROUND);

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);

        LinearLayout outer = column();
        padding(outer, 20, 20, 20, 110);

        // HEADER
        LinearLayout header = row();

        TextView logo = label("✦", 26, PRIMARY, true);
        logo.setGravity(Gravity.CENTER);
        logo.setBackground(rounded(SURFACE, 16));
        logo.setOnClickListener(v -> showHome());
        header.addView(logo, params(54, 54));

        LinearLayout heading = column();
        padding(heading, 16, 0, 0, 0);
        heading.addView(label(title, 24, TEXT_DARK, true));

        if (subtitle != null) {
            heading.addView(label(subtitle, 14, PRIMARY, false));
        }

        header.addView(heading, new LinearLayout.LayoutParams(0, -2, 1));

        TextView avatar = label("U", 16, PRIMARY, true);
        avatar.setGravity(Gravity.CENTER);
        addRipple(avatar, SURFACE, BORDER, 40);
        avatar.setOnClickListener(v -> showProfile());
        header.addView(avatar, params(48, 48));

        outer.addView(header);
        gap(outer, 32);

        body = column();
        outer.addView(body);

        scroll.addView(outer);
        rootContainer.addView(scroll, new FrameLayout.LayoutParams(-1, -1));

        View nav = bottomNavigation();
        FrameLayout.LayoutParams navParams = new FrameLayout.LayoutParams(-1, -2);
        navParams.gravity = Gravity.BOTTOM;
        navParams.setMargins(dp(20), 0, dp(20), dp(20));
        rootContainer.addView(nav, navParams);

        setContentView(rootContainer);
    }

    private void addCard(LinearLayout parent, View content) {
        LinearLayout card = column();
        padding(card, 20, 20, 20, 20);
        card.setBackground(outlined(SURFACE, 24, BORDER));
        card.setElevation(dp(4));
        card.addView(content);

        LinearLayout.LayoutParams cardParams = params(-1, -2);
        cardParams.bottomMargin = dp(16);
        parent.addView(card, cardParams);
    }

    private void sectionTitle(LinearLayout parent, String value) {
        parent.addView(label(value, 18, TEXT_DARK, true));
        gap(parent, 14);
    }

    // ==============================
    // 1. HALAMAN BERANDA (HOME)
    // ==============================

    private void showHome() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        String greet = hour < 11 ? "Selamat Pagi ✦" : hour < 15 ? "Selamat Siang ✦" : hour < 18 ? "Selamat Sore ✦" : "Selamat Malam ✦";

        startPage("TimeStamp Pro", greet, 0);

        LinearLayout hero = column();
        hero.setBackground(gradient(SECONDARY, PRIMARY, 28));
        hero.setElevation(dp(10));
        padding(hero, 26, 28, 26, 28);

        hero.addView(label("✨ ULTIMATE EDITION", 12, BACKGROUND, true));
        gap(hero, 12);

        hero.addView(label("Kamera & Video\nRealtime Presisi.", 28, TEXT_DARK, true));
        gap(hero, 10);

        hero.addView(label("Abadikan momen dengan watermark lokasi & waktu yang menyatu elegan.", 14, Color.parseColor("#E2E8F0"), false));
        gap(hero, 24);

        TextView btnCam = label("📸 Buka Kamera / Video", 15, TEXT_DARK, true);
        btnCam.setGravity(Gravity.CENTER);
        padding(btnCam, 0, 16, 0, 16);
        addRipple(btnCam, BACKGROUND, ACCENT, 20);
        btnCam.setOnClickListener(v -> openRealtimeCamera());
        hero.addView(btnCam);

        body.addView(hero);
        gap(body, 32);

        sectionTitle(body, "Akses Cepat");

        LinearLayout quickRow = row();
        addQuick(quickRow, "▧", "Galeri", "Pilih Foto", this::openGallery);
        addQuick(quickRow, "✎", "Editor", "Manual", this::showEditor);
        body.addView(quickRow);

        gap(body, 32);

        sectionTitle(body, "Fitur Unggulan");
        addFeature("⏱", "Jam Live Presisi", "Waktu WIB diperbarui setiap detik.");
        addFeature("📍", "Lokasi & Alamat", "Deteksi koordinat & nama jalan otomatis.");
        addFeature("📹", "Video Recording", "Rekam video langsung dengan watermark.");
    }

    private void addQuick(LinearLayout parent, String icon, String title, String subtitle, Runnable action) {
        LinearLayout card = column();
        padding(card, 12, 20, 12, 20);
        card.setGravity(Gravity.CENTER);
        addRipple(card, SURFACE, ACCENT, 24);
        card.setBackground(outlined(SURFACE, 24, BORDER));

        TextView iconView = label(icon, 26, PRIMARY, true);
        iconView.setGravity(Gravity.CENTER);
        iconView.setBackground(rounded(ACCENT, 20));

        card.addView(iconView, params(60, 60));
        gap(card, 12);

        card.addView(label(title, 15, TEXT_DARK, true));
        card.addView(label(subtitle, 12, TEXT_MUTED, false));

        card.setOnClickListener(view -> action.run());

        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, -2, 1);
        p.setMargins(dp(6), 0, dp(6), 0);
        parent.addView(card, p);
    }

    private void addFeature(String icon, String title, String description) {
        LinearLayout content = row();

        TextView iconView = label(icon, 22, SECONDARY, true);
        iconView.setGravity(Gravity.CENTER);
        iconView.setBackground(rounded(ACCENT, 18));

        content.addView(iconView, params(54, 54));

        LinearLayout texts = column();
        padding(texts, 16, 0, 0, 0);

        texts.addView(label(title, 16, TEXT_DARK, true));
        texts.addView(label(description, 13, TEXT_MUTED, false));

        content.addView(texts);
        addCard(body, content);
    }

    // ==============================
    // 2. KAMERA & VIDEO REALTIME
    // ==============================

    private void openRealtimeCamera() {
        if (checkSelfPermission(android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{
                    android.Manifest.permission.CAMERA,
                    android.Manifest.permission.RECORD_AUDIO
            }, CAMERA_PERMISSION_CODE);
        } else {
            showLiveCameraView();
        }
    }

    private void showLiveCameraView() {
        activeTab = 4;
        fetchCurrentLocation();

        FrameLayout cameraLayout = new FrameLayout(this);
        cameraLayout.setBackgroundColor(Color.BLACK);

        SurfaceView cameraSurfaceView = new SurfaceView(this);
        cameraSurfaceHolder = cameraSurfaceView.getHolder();
        cameraSurfaceHolder.addCallback(this);

        cameraLayout.addView(cameraSurfaceView, new FrameLayout.LayoutParams(-1, -1));

        FrameLayout overlayContainer = new FrameLayout(this);
        padding(overlayContainer, 20, 20, 20, 20);

        // Watermark Live
        LinearLayout liveStampBadge = column();
        liveStampBadge.setGravity(Gravity.END);

        liveTimeText = label(stampDate + " " + stampTime, 15, Color.WHITE, true);
        liveTimeText.setGravity(Gravity.END);
        liveTimeText.setShadowLayer(6f, 2f, 2f, Color.BLACK);
        liveStampBadge.addView(liveTimeText);

        gap(liveStampBadge, 3);

        liveNoteText = label(note, 14, Color.WHITE, true);
        liveNoteText.setGravity(Gravity.END);
        liveNoteText.setShadowLayer(6f, 2f, 2f, Color.BLACK);
        if (note.isEmpty()) liveNoteText.setVisibility(View.GONE);
        liveStampBadge.addView(liveNoteText);

        gap(liveStampBadge, 3);

        String formattedLoc = location.isEmpty() ? "Lokasi GPS Realtime" : location.replace(", ", "\n");
        liveLocationText = label(formattedLoc, 13, Color.WHITE, true);
        liveLocationText.setGravity(Gravity.END);
        liveLocationText.setShadowLayer(6f, 2f, 2f, Color.BLACK);
        liveStampBadge.addView(liveLocationText);

        FrameLayout.LayoutParams badgeParams = new FrameLayout.LayoutParams(-2, -2);

        if ("Bawah Kiri".equalsIgnoreCase(stampPosition)) {
            badgeParams.gravity = Gravity.BOTTOM | Gravity.START;
            badgeParams.bottomMargin = dp(155);
            badgeParams.leftMargin = dp(16);
            liveStampBadge.setGravity(Gravity.START);
            liveTimeText.setGravity(Gravity.START);
            liveNoteText.setGravity(Gravity.START);
            liveLocationText.setGravity(Gravity.START);
        } else if ("Atas Kiri".equalsIgnoreCase(stampPosition)) {
            badgeParams.gravity = Gravity.TOP | Gravity.START;
            badgeParams.topMargin = dp(80);
            badgeParams.leftMargin = dp(16);
            liveStampBadge.setGravity(Gravity.START);
            liveTimeText.setGravity(Gravity.START);
            liveNoteText.setGravity(Gravity.START);
            liveLocationText.setGravity(Gravity.START);
        } else if ("Atas Kanan".equalsIgnoreCase(stampPosition)) {
            badgeParams.gravity = Gravity.TOP | Gravity.END;
            badgeParams.topMargin = dp(80);
            badgeParams.rightMargin = dp(16);
            liveStampBadge.setGravity(Gravity.END);
            liveTimeText.setGravity(Gravity.END);
            liveNoteText.setGravity(Gravity.END);
            liveLocationText.setGravity(Gravity.END);
        } else {
            // Default "Bawah Kanan"
            badgeParams.gravity = Gravity.BOTTOM | Gravity.END;
            badgeParams.bottomMargin = dp(155);
            badgeParams.rightMargin = dp(16);
            liveStampBadge.setGravity(Gravity.END);
            liveTimeText.setGravity(Gravity.END);
            liveNoteText.setGravity(Gravity.END);
            liveLocationText.setGravity(Gravity.END);
        }

        overlayContainer.addView(liveStampBadge, badgeParams);
        liveStampBadge.setElevation(dp(10));
        liveStampBadge.bringToFront();

        // Top Control Bar
        LinearLayout topBar = row();
        topBar.setBackground(rounded(0x66000000, 24));
        padding(topBar, 12, 10, 12, 10);

        TextView btnBack = label("◀ Kembali", 14, Color.WHITE, true);
        padding(btnBack, 16, 8, 16, 8);
        btnBack.setBackground(rounded(0x44FFFFFF, 16));
        btnBack.setOnClickListener(v -> showHome());
        topBar.addView(btnBack);

        View spring = new View(this);
        topBar.addView(spring, new LinearLayout.LayoutParams(0, 1, 1));

        TextView btnFlash = label(isFlashOn ? "⚡ On" : "⚡ Off", 13, Color.WHITE, true);
        padding(btnFlash, 16, 8, 16, 8);
        btnFlash.setBackground(rounded(0x44FFFFFF, 16));
        btnFlash.setOnClickListener(v -> toggleFlash(btnFlash));
        topBar.addView(btnFlash);

        gap(topBar, 10);

        TextView btnSwitch = label("🔄", 16, Color.WHITE, true);
        padding(btnSwitch, 16, 8, 16, 8);
        btnSwitch.setBackground(rounded(0x44FFFFFF, 16));
        btnSwitch.setOnClickListener(v -> switchCamera());
        topBar.addView(btnSwitch);

        FrameLayout.LayoutParams topParams = new FrameLayout.LayoutParams(-1, -2);
        topParams.gravity = Gravity.TOP;
        topParams.topMargin = dp(20);
        overlayContainer.addView(topBar, topParams);

        // Bottom Capture Shutter Bar
        LinearLayout bottomBar = column();
        bottomBar.setGravity(Gravity.CENTER);

        LinearLayout modeRow = row();
        modeRow.setGravity(Gravity.CENTER);
        modeRow.setBackground(rounded(0x88000000, 24));
        padding(modeRow, 6, 6, 6, 6);

        TextView modePhoto = label("FOTO", 12, !isVideoMode ? Color.BLACK : Color.WHITE, true);
        padding(modePhoto, 20, 10, 20, 10);
        modePhoto.setBackground(rounded(!isVideoMode ? PRIMARY : Color.TRANSPARENT, 20));

        TextView modeVideo = label("VIDEO", 12, isVideoMode ? Color.WHITE : Color.WHITE, true);
        padding(modeVideo, 20, 10, 20, 10);
        modeVideo.setBackground(rounded(isVideoMode ? Color.parseColor("#EF4444") : Color.TRANSPARENT, 20));

        modePhoto.setOnClickListener(v -> { if (isRecordingVideo) return; isVideoMode = false; showLiveCameraView(); });
        modeVideo.setOnClickListener(v -> { if (isRecordingVideo) return; isVideoMode = true; showLiveCameraView(); });

        modeRow.addView(modePhoto);
        modeRow.addView(modeVideo);
        bottomBar.addView(modeRow);
        gap(bottomBar, 16);

        shutterBtn = label(isVideoMode ? (isRecordingVideo ? "⏹ STOP" : "⏺ REKAM") : "📸 JEPRET", 16, isVideoMode ? Color.WHITE : BACKGROUND, true);
        shutterBtn.setGravity(Gravity.CENTER);
        padding(shutterBtn, 0, 20, 0, 20);

        if (isVideoMode) {
            shutterBtn.setBackground(gradient(Color.parseColor("#EF4444"), Color.parseColor("#991B1B"), 35));
        } else {
            shutterBtn.setBackground(gradient(PRIMARY, SECONDARY, 35));
        }
        shutterBtn.setElevation(dp(8));
        shutterBtn.setOnClickListener(v -> {
            if (isVideoMode) { if (isRecordingVideo) stopVideoRecording(); else startVideoRecording(); }
            else { takeRealtimePhoto(); }
        });

        bottomBar.addView(shutterBtn, params(220, 65));
        gap(bottomBar, 14);

        LinearLayout quickCamRow = row();
        quickCamRow.setGravity(Gravity.CENTER);

        TextView btnGal = label("▧ Galeri", 13, Color.WHITE, true);
        padding(btnGal, 16, 8, 16, 8);
        btnGal.setBackground(rounded(0x66000000, 16));
        btnGal.setOnClickListener(v -> openGallery());
        quickCamRow.addView(btnGal);

        gap(quickCamRow, 12);

        TextView btnEditLoc = label("📍 Ubah Alamat", 13, Color.WHITE, true);
        padding(btnEditLoc, 16, 8, 16, 8);
        btnEditLoc.setBackground(rounded(0x66000000, 16));
        btnEditLoc.setOnClickListener(v -> showEditLocationDialog());
        quickCamRow.addView(btnEditLoc);

        bottomBar.addView(quickCamRow);

        FrameLayout.LayoutParams bottomParams = new FrameLayout.LayoutParams(-1, -2);
        bottomParams.gravity = Gravity.BOTTOM;
        bottomParams.bottomMargin = dp(24);
        overlayContainer.addView(bottomBar, bottomParams);

        cameraLayout.addView(overlayContainer, new FrameLayout.LayoutParams(-1, -1));
        overlayContainer.bringToFront();

        setContentView(cameraLayout);
        startTimer();
    }

    private void startVideoRecording() {
        if (mCamera == null) return;
        try {
            mCamera.unlock();
            mMediaRecorder = new MediaRecorder();
            mMediaRecorder.setCamera(mCamera);
            mMediaRecorder.setAudioSource(MediaRecorder.AudioSource.CAMCORDER);
            mMediaRecorder.setVideoSource(MediaRecorder.VideoSource.CAMERA);

            CamcorderProfile profile = CamcorderProfile.hasProfile(currentCameraId, CamcorderProfile.QUALITY_HIGH)
                    ? CamcorderProfile.get(currentCameraId, CamcorderProfile.QUALITY_HIGH)
                    : CamcorderProfile.get(CamcorderProfile.QUALITY_LOW);
            mMediaRecorder.setProfile(profile);

            File movieDir = new File(getCacheDir(), "videos");
            if (!movieDir.exists()) movieDir.mkdirs();
            videoFile = new File(movieDir, "VID_" + System.currentTimeMillis() + ".mp4");

            mMediaRecorder.setOutputFile(videoFile.getAbsolutePath());
            mMediaRecorder.setPreviewDisplay(cameraSurfaceHolder.getSurface());
            mMediaRecorder.setOrientationHint(currentCameraId == Camera.CameraInfo.CAMERA_FACING_FRONT ? 270 : 90);
            mMediaRecorder.prepare();
            mMediaRecorder.start();

            isRecordingVideo = true;
            videoSeconds = 0;
            if (shutterBtn != null) shutterBtn.setText("⏹ 00:00");

            recordRunnable = new Runnable() {
                @Override
                public void run() {
                    if (isRecordingVideo) {
                        videoSeconds++;
                        int mins = videoSeconds / 60;
                        int secs = videoSeconds % 60;
                        if (shutterBtn != null) shutterBtn.setText(String.format(Locale.getDefault(), "⏹ %02d:%02d", mins, secs));
                        recordHandler.postDelayed(this, 1000);
                    }
                }
            };
            recordHandler.postDelayed(recordRunnable, 1000);
            toast("🔴 Mulai merekam video...");

        } catch (Exception e) {
            toast("Gagal memulai perekaman video.");
            releaseMediaRecorder();
        }
    }

    private void stopVideoRecording() {
        if (!isRecordingVideo) return;
        try {
            isRecordingVideo = false;
            recordHandler.removeCallbacks(recordRunnable);
            mMediaRecorder.stop();
            releaseMediaRecorder();
            mCamera.lock();
            toast("Video berhasil direkam! 📹");
            saveVideoToGallery(videoFile);
        } catch (Exception e) {
            toast("Gagal menghentikan perekaman video.");
            releaseMediaRecorder();
        } finally {
            showLiveCameraView();
        }
    }

    private void releaseMediaRecorder() {
        if (mMediaRecorder != null) {
            mMediaRecorder.reset();
            mMediaRecorder.release();
            mMediaRecorder = null;
        }
    }

    private void saveVideoToGallery(File file) {
        if (file == null || !file.exists()) return;
        Uri savedUri = null;
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Video.Media.TITLE, "TimeStamp_Video_" + System.currentTimeMillis());
            values.put(MediaStore.Video.Media.DISPLAY_NAME, "VID_" + System.currentTimeMillis() + ".mp4");
            values.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");

            savedUri = getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
            if (savedUri != null) {
                java.io.OutputStream os = getContentResolver().openOutputStream(savedUri);
                java.io.InputStream is = new java.io.FileInputStream(file);
                byte[] buf = new byte[8192];
                int len;
                while ((len = is.read(buf)) > 0) {
                    os.write(buf, 0, len);
                }
                os.close();
                is.close();
            }
        } catch (Exception e) {
            savedUri = null;
        }

        if (savedUri == null) {
            try {
                savedUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
            } catch (Exception e) {
                savedUri = Uri.fromFile(file);
            }
        }

        historyList.add(0, new StampHistoryItem(savedUri, stampDate + " " + stampTime, location, note));
    }

    private void showEditLocationDialog() {
        final EditText input = new EditText(this);
        input.setText(location);
        input.setTextColor(Color.BLACK);
        padding(input, 14, 12, 14, 12);

        new AlertDialog.Builder(this)
                .setTitle("📍 Ubah Alamat")
                .setView(input)
                .setPositiveButton("Simpan", (d, w) -> { location = input.getText().toString(); updateRealtimeClock(); })
                .setNegativeButton("GPS", (d, w) -> { fetchCurrentLocation(); updateRealtimeClock(); })
                .show();
    }

    private void toggleFlash(TextView btnFlash) {
        if (mCamera == null) return;
        try {
            Camera.Parameters params = mCamera.getParameters();
            if (isFlashOn) { params.setFlashMode(Camera.Parameters.FLASH_MODE_OFF); isFlashOn = false; btnFlash.setText("⚡ Off"); }
            else { params.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH); isFlashOn = true; btnFlash.setText("⚡ On"); }
            mCamera.setParameters(params);
        } catch (Exception e) { toast("Flashlight tidak didukung."); }
    }

    private void switchCamera() {
        if (isRecordingVideo) return;
        releaseCamera();
        currentCameraId = (currentCameraId == Camera.CameraInfo.CAMERA_FACING_BACK) ? Camera.CameraInfo.CAMERA_FACING_FRONT : Camera.CameraInfo.CAMERA_FACING_BACK;
        if (cameraSurfaceHolder != null) surfaceCreated(cameraSurfaceHolder);
    }

    @Override
    public void surfaceCreated(@NonNull SurfaceHolder holder) {
        try {
            mCamera = Camera.open(currentCameraId);
            mCamera.setDisplayOrientation(90);
            mCamera.setPreviewDisplay(holder);
            mCamera.startPreview();
            isPreviewRunning = true;
        } catch (Exception e) {
            toast("Kamera intent fallback...");
            openCameraIntentFallback();
        }
    }

    @Override
    public void surfaceChanged(@NonNull SurfaceHolder holder, int format, int width, int height) {
        if (mCamera != null && isPreviewRunning) {
            try { mCamera.stopPreview(); mCamera.setPreviewDisplay(holder); mCamera.startPreview(); } catch (Exception ignored) {}
        }
    }

    @Override
    public void surfaceDestroyed(@NonNull SurfaceHolder holder) { releaseCamera(); }

    private void releaseCamera() {
        if (mCamera != null) {
            try { mCamera.stopPreview(); mCamera.setPreviewCallback(null); mCamera.release(); } catch (Exception ignored) {}
            mCamera = null;
            isPreviewRunning = false;
        }
    }

    private void takeRealtimePhoto() {
        if (mCamera != null && isPreviewRunning) {
            try {
                mCamera.takePicture(null, null, (data, camera) -> {
                    Bitmap rawBitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
                    if (rawBitmap != null) {
                        Matrix matrix = new Matrix();
                        matrix.postRotate(currentCameraId == Camera.CameraInfo.CAMERA_FACING_FRONT ? 270 : 90);
                        Bitmap rotated = Bitmap.createBitmap(rawBitmap, 0, 0, rawBitmap.getWidth(), rawBitmap.getHeight(), matrix, true);
                        stampedBitmap = createStampedBitmap(rotated, stampDate, stampTime, location, note, colorName, stampPosition);
                        saveImageToGallery(stampedBitmap);
                        showResult();
                    } else { toast("Gagal foto."); }
                });
            } catch (Exception e) { toast("Gagal foto realtime."); }
        } else { openCameraIntentFallback(); }
    }

    private void openCameraIntentFallback() {
        try {
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            File cameraDir = new File(getCacheDir(), "camera");
            if (cameraDir.exists() || cameraDir.mkdirs()) {
                cameraPhotoFile = new File(cameraDir, "photo_" + System.currentTimeMillis() + ".jpg");
                cameraPhotoUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", cameraPhotoFile);
                intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            }
            startActivityForResult(intent, TAKE_PHOTO);
        } catch (Exception e) { toast("Kamera tidak tersedia."); }
    }

    private void openGallery() {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.setType("image/*");
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(intent, PICK_IMAGE);
        } catch (Exception e) {
            Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
            fallback.setType("image/*");
            startActivityForResult(fallback, PICK_IMAGE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                showLiveCameraView();
            } else {
                toast("Izin kamera & audio diperlukan.");
            }
        } else if (requestCode == LOCATION_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                fetchCurrentLocation();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK) return;

        if (requestCode == PICK_IMAGE && data != null && data.getData() != null) {
            try {
                InputStream is = getContentResolver().openInputStream(data.getData());
                selectedBitmap = BitmapFactory.decodeStream(is);
                if (is != null) is.close();
                showEditor();
            } catch (Exception e) { toast("Gagal memuat gambar."); }
        }

        if (requestCode == TAKE_PHOTO) {
            if (cameraPhotoFile != null && cameraPhotoFile.exists() && cameraPhotoFile.length() > 0) {
                try {
                    selectedBitmap = BitmapFactory.decodeFile(cameraPhotoFile.getAbsolutePath());
                    if (selectedBitmap != null) { showEditor(); return; }
                } catch (Exception ignored) {}
            }
            if (data != null && data.getExtras() != null && data.getExtras().get("data") instanceof Bitmap) {
                selectedBitmap = (Bitmap) data.getExtras().get("data");
                showEditor();
            }
        }
    }

    private Bitmap getOrCreateSampleBitmap() {
        if (selectedBitmap != null) return selectedBitmap;

        int size = dp(320);
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);

        Paint bgPaint = new Paint();
        bgPaint.setColor(SURFACE);
        canvas.drawRect(0, 0, size, size, bgPaint);

        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(PRIMARY);
        textPaint.setTextSize(dp(22));
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));

        canvas.drawText("📸 Pilih Foto", size / 2f, size / 2f - dp(10), textPaint);

        textPaint.setTextSize(dp(13));
        textPaint.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        textPaint.setColor(TEXT_MUTED);
        canvas.drawText("Gunakan galeri atau kamera", size / 2f, size / 2f + dp(20), textPaint);

        return bmp;
    }

    // ==============================
    // 3. HALAMAN EDITOR (MANUAL)
    // ==============================

    private EditText createField(String hint) {
        EditText field = new EditText(this);
        field.setSingleLine(true);
        field.setTextSize(15);
        field.setHint(hint);
        field.setHintTextColor(Color.parseColor("#475569"));
        field.setTextColor(TEXT_DARK);
        padding(field, 18, 16, 18, 16);
        field.setBackground(outlined(SURFACE, 18, BORDER));
        return field;
    }

    private void showEditor() {
        startPage("Editor Manual", "Sesuaikan watermark foto", 1);

        Bitmap activeImg = getOrCreateSampleBitmap();

        LinearLayout previewContainer = column();
        previewContainer.setGravity(Gravity.CENTER);
        padding(previewContainer, 16, 16, 16, 16);
        previewContainer.setBackground(outlined(SURFACE, 24, BORDER));
        previewContainer.setElevation(dp(4));

        ImageView imageView = new ImageView(this);
        imageView.setImageBitmap(activeImg);
        imageView.setAdjustViewBounds(true);
        imageView.setMaxHeight(dp(260));
        imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);

        previewContainer.addView(imageView);
        body.addView(previewContainer);

        gap(body, 20);

        LinearLayout photoActions = row();
        photoActions.addView(button("📸 Realtime", true, this::openRealtimeCamera), new LinearLayout.LayoutParams(0, -2, 1));
        gap(photoActions, 12);
        photoActions.addView(button("▧ Galeri", false, this::openGallery), new LinearLayout.LayoutParams(0, -2, 1));
        body.addView(photoActions);

        gap(body, 32);
        sectionTitle(body, "Data Timestamp");

        LinearLayout dateRow = row();
        EditText dateField = createField("Tanggal");
        dateField.setText(stampDate);
        dateRow.addView(dateField, new LinearLayout.LayoutParams(0, -2, 1));
        gap(dateRow, 10);
        TextView btnPickDate = label("📅", 20, PRIMARY, true);
        padding(btnPickDate, 18, 14, 18, 14);
        addRipple(btnPickDate, SURFACE, BORDER, 18);
        btnPickDate.setBackground(outlined(SURFACE, 18, BORDER));
        btnPickDate.setOnClickListener(v -> openDatePicker(dateField));
        dateRow.addView(btnPickDate);
        body.addView(dateRow);
        gap(body, 14);

        LinearLayout timeRow = row();
        EditText timeField = createField("Waktu");
        timeField.setText(stampTime);
        timeRow.addView(timeField, new LinearLayout.LayoutParams(0, -2, 1));
        gap(timeRow, 10);
        TextView btnPickTime = label("⏰", 20, PRIMARY, true);
        padding(btnPickTime, 18, 14, 18, 14);
        addRipple(btnPickTime, SURFACE, BORDER, 18);
        btnPickTime.setBackground(outlined(SURFACE, 18, BORDER));
        btnPickTime.setOnClickListener(v -> openTimePicker(timeField));
        timeRow.addView(btnPickTime);
        body.addView(timeRow);
        gap(body, 14);

        EditText locField = createField("Nama Lokasi (e.g. Jakarta)");
        locField.setText(location);
        body.addView(locField);
        gap(body, 10);

        HorizontalScrollView locScroll = new HorizontalScrollView(this);
        locScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout locChips = row();
        String[] sampleLocations = {
                "📍 Kecamatan Pulo Gadung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta",
                "📍 Jakarta",
                "📍 Bandung",
                "📍 Surabaya",
                "📍 Bali"
        };
        for (String locName : sampleLocations) {
            TextView chip = label(locName, 13, TEXT_DARK, false);
            padding(chip, 16, 8, 16, 8);
            addRipple(chip, SURFACE, ACCENT, 16);
            chip.setBackground(outlined(SURFACE, 16, BORDER));
            chip.setOnClickListener(v -> locField.setText(locName.replace("📍 ", "")));
            locChips.addView(chip);
            gap(locChips, 10);
        }
        locScroll.addView(locChips);
        body.addView(locScroll);
        gap(body, 14);

        EditText noteField = createField("Catatan / Blok (e.g. 5 Blok B)");
        noteField.setText(note);
        body.addView(noteField);
        gap(body, 32);

        sectionTitle(body, "Tata Letak (Posisi)");
        LinearLayout posRow = row();
        String[] positions = {"Bawah Kanan", "Atas Kanan", "Bawah Kiri", "Atas Kiri"};
        for (String pos : positions) {
            boolean isSelected = pos.equalsIgnoreCase(stampPosition);
            TextView chip = label(pos, 13, isSelected ? BACKGROUND : TEXT_DARK, isSelected);
            padding(chip, 18, 10, 18, 10);
            if (isSelected) chip.setBackground(gradient(PRIMARY, SECONDARY, 18));
            else { addRipple(chip, SURFACE, ACCENT, 18); chip.setBackground(outlined(SURFACE, 18, BORDER)); }
            chip.setOnClickListener(v -> { stampPosition = pos; showEditor(); });
            posRow.addView(chip);
            gap(posRow, 10);
        }
        HorizontalScrollView posScroll = new HorizontalScrollView(this);
        posScroll.setHorizontalScrollBarEnabled(false);
        posScroll.addView(posRow);
        body.addView(posScroll);
        gap(body, 28);

        sectionTitle(body, "Gaya Warna Overlay");
        LinearLayout colorRow = row();
        String[] colors = {"Putih", "Biru", "Hitam", "Kuning", "Hijau"};
        for (String col : colors) {
            boolean isSelected = col.equalsIgnoreCase(colorName);
            TextView chip = label(col, 13, isSelected ? BACKGROUND : TEXT_DARK, isSelected);
            padding(chip, 18, 10, 18, 10);
            if (isSelected) chip.setBackground(gradient(PRIMARY, SECONDARY, 18));
            else { addRipple(chip, SURFACE, ACCENT, 18); chip.setBackground(outlined(SURFACE, 18, BORDER)); }
            chip.setOnClickListener(v -> { colorName = col; showEditor(); });
            colorRow.addView(chip);
            gap(colorRow, 10);
        }
        HorizontalScrollView colorScroll = new HorizontalScrollView(this);
        colorScroll.setHorizontalScrollBarEnabled(false);
        colorScroll.addView(colorRow);
        body.addView(colorScroll);
        gap(body, 32);

        body.addView(button("✦ Terapkan Watermark", true, () -> {
            stampDate = dateField.getText().toString();
            stampTime = timeField.getText().toString();
            location = locField.getText().toString();
            note = noteField.getText().toString();
            stampedBitmap = createStampedBitmap(getOrCreateSampleBitmap(), stampDate, stampTime, location, note, colorName, stampPosition);
            showResult();
        }));
    }

    private void openDatePicker(EditText targetField) {
        Calendar cal = Calendar.getInstance();
        new DatePickerDialog(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK, (view, year, month, dayOfMonth) -> {
            cal.set(year, month, dayOfMonth);
            targetField.setText(new SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(cal.getTime()));
        }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show();
    }

    private void openTimePicker(EditText targetField) {
        Calendar cal = Calendar.getInstance();
        new TimePickerDialog(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK, (view, hourOfDay, minute) -> {
            cal.set(Calendar.HOUR_OF_DAY, hourOfDay);
            cal.set(Calendar.MINUTE, minute);
            targetField.setText(new SimpleDateFormat("HH.mm.ss", Locale.getDefault()).format(cal.getTime()));
        }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show();
    }

    // ==============================
    // CANVAS STAMP GENERATOR (DESAIN POJOK KANAN BAWAH)
    // ==============================

    private Bitmap createStampedBitmap(Bitmap original, String date, String time, String loc, String noteText, String colorMode, String position) {
        if (original == null) return null;

        Bitmap mutable = original.copy(Bitmap.Config.ARGB_8888, true);
        Canvas canvas = new Canvas(mutable);

        int w = mutable.getWidth();
        int h = mutable.getHeight();

        // Skala teks proporsional agar tidak terlalu besar di foto beresolusi tinggi (misal kamera belakang)
        float baseSize = Math.max(18f, Math.min(w, h) * 0.024f);

        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(baseSize);
        textPaint.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));

        if (colorMode.equalsIgnoreCase("Kuning")) textPaint.setColor(Color.YELLOW);
        else if (colorMode.equalsIgnoreCase("Biru")) textPaint.setColor(Color.CYAN);
        else if (colorMode.equalsIgnoreCase("Hijau")) textPaint.setColor(Color.GREEN);
        else if (colorMode.equalsIgnoreCase("Hitam")) textPaint.setColor(Color.BLACK);

        textPaint.setShadowLayer(baseSize * 0.15f, 2f, 2f, Color.parseColor("#99000000"));

        List<String> lines = new ArrayList<>();

        String formattedTime = time.replace(":", ".");
        lines.add(date + " " + formattedTime);

        if (noteText != null && !noteText.trim().isEmpty()) {
            lines.add(noteText.trim());
        }

        if (loc != null && !loc.trim().isEmpty()) {
            String[] locParts = loc.split(",");
            for (String part : locParts) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    lines.add(trimmed);
                }
            }
        }

        float padding = baseSize * 0.8f;
        float lineSpacing = baseSize * 0.35f;
        float totalHeight = (baseSize * lines.size()) + (lineSpacing * (lines.size() - 1));

        float rightX = w - padding;
        float startY = h - padding - totalHeight + baseSize;

        if (position.equalsIgnoreCase("Atas Kanan")) {
            startY = padding + baseSize;
            textPaint.setTextAlign(Paint.Align.RIGHT);
            rightX = w - padding;
        } else if (position.equalsIgnoreCase("Atas Kiri")) {
            startY = padding + baseSize;
            textPaint.setTextAlign(Paint.Align.LEFT);
            rightX = padding;
        } else if (position.equalsIgnoreCase("Bawah Kiri")) {
            startY = h - padding - totalHeight + baseSize;
            textPaint.setTextAlign(Paint.Align.LEFT);
            rightX = padding;
        } else {
            // Default "Bawah Kanan"
            textPaint.setTextAlign(Paint.Align.RIGHT);
            rightX = w - padding;
        }

        float currentY = startY;
        for (String line : lines) {
            canvas.drawText(line, rightX, currentY, textPaint);
            currentY += baseSize + lineSpacing;
        }

        return mutable;
    }

    // ==============================
    // HALAMAN HASIL
    // ==============================

    private void showResult() {
        startPage("Selesai!", "Pratinjau Foto Anda", 1);

        LinearLayout previewCard = column();
        padding(previewCard, 16, 16, 16, 16);
        previewCard.setBackground(outlined(SURFACE, 24, BORDER));
        previewCard.setElevation(dp(4));

        ImageView imageView = new ImageView(this);
        imageView.setImageBitmap(stampedBitmap);
        imageView.setAdjustViewBounds(true);
        imageView.setMaxHeight(dp(360));
        imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);

        previewCard.addView(imageView);
        body.addView(previewCard);
        gap(body, 32);

        body.addView(button("💾 Simpan ke Galeri", true, () -> saveImageToGallery(stampedBitmap)));
        gap(body, 14);

        LinearLayout shareRow = row();
        shareRow.addView(button("📤 Bagikan", false, () -> shareImage(stampedBitmap)), new LinearLayout.LayoutParams(0, -2, 1));
        gap(shareRow, 12);
        shareRow.addView(button("✎ Edit Lagi", false, this::showEditor), new LinearLayout.LayoutParams(0, -2, 1));
        body.addView(shareRow);
    }

    private void saveImageToGallery(Bitmap bitmap) {
        if (bitmap == null) return;
        try {
            MediaStore.Images.Media.insertImage(getContentResolver(), bitmap, "TimeStampPro_" + System.currentTimeMillis(), "Foto Timestamp Pro Edit");
            historyList.add(0, new StampHistoryItem(bitmap, stampDate + " " + stampTime, location));
            toast("Tersimpan di Galeri! ✨");
        } catch (Exception e) {
            historyList.add(0, new StampHistoryItem(bitmap, stampDate + " " + stampTime, location));
            toast("Tersimpan ke riwayat aplikasi.");
        }
    }

    private void shareImage(Bitmap bitmap) {
        if (bitmap == null) return;
        try {
            String path = MediaStore.Images.Media.insertImage(getContentResolver(), bitmap, "Share_" + System.currentTimeMillis(), null);
            if (path != null) {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("image/jpeg");
                shareIntent.putExtra(Intent.EXTRA_STREAM, Uri.parse(path));
                shareIntent.putExtra(Intent.EXTRA_TEXT, "Dikirim via TimeStamp Pro ✦");
                startActivity(Intent.createChooser(shareIntent, "Bagikan Foto"));
            }
        } catch (Exception e) { toast("Gagal membagikan foto."); }
    }

    // ==============================
    // HALAMAN RIWAYAT (HISTORY)
    // ==============================

    private void showHistory() {
        startPage("Riwayat", "Media Tersimpan", 2);

        if (historyList.isEmpty()) {
            LinearLayout empty = column();
            empty.setGravity(Gravity.CENTER);
            padding(empty, 20, 40, 20, 40);

            empty.addView(label("◷", 48, SECONDARY, true));
            gap(empty, 16);
            empty.addView(label("Belum ada riwayat", 18, TEXT_DARK, true));
            gap(empty, 8);
            empty.addView(label("Foto atau video tersimpan akan muncul di sini.", 14, TEXT_MUTED, false));

            addCard(body, empty);
            gap(body, 20);
            body.addView(button("＋ Ambil Foto / Video Baru", true, this::openRealtimeCamera));
        } else {
            sectionTitle(body, "Total " + historyList.size() + " Media");

            for (int i = 0; i < historyList.size(); i++) {
                final int index = i;
                StampHistoryItem item = historyList.get(i);

                LinearLayout card = column();
                padding(card, 16, 16, 16, 16);
                card.setBackground(outlined(SURFACE, 20, BORDER));
                card.setElevation(dp(4));

                LinearLayout itemHeader = row();

                if (item.isVideo) {
                    TextView videoBadge = label("📹\nVideo", 12, Color.WHITE, true);
                    videoBadge.setGravity(Gravity.CENTER);
                    videoBadge.setBackground(rounded(Color.parseColor("#EF4444"), 16));
                    itemHeader.addView(videoBadge, params(70, 70));
                } else {
                    ImageView thumb = new ImageView(this);
                    thumb.setImageBitmap(item.bitmap);
                    thumb.setScaleType(ImageView.ScaleType.CENTER_CROP);

                    FrameLayout thumbFrame = new FrameLayout(this);
                    thumbFrame.setBackground(rounded(ACCENT, 16));
                    thumbFrame.setClipToOutline(true);
                    thumbFrame.addView(thumb, new FrameLayout.LayoutParams(-1, -1));
                    itemHeader.addView(thumbFrame, params(70, 70));
                }

                LinearLayout details = column();
                padding(details, 16, 0, 0, 0);

                details.addView(label((item.isVideo ? "📹 Video " : "📸 Foto ") + item.dateTime, 15, TEXT_DARK, true));
                gap(details, 6);
                details.addView(label("📍 " + item.location, 12, TEXT_MUTED, false));

                itemHeader.addView(details, new LinearLayout.LayoutParams(0, -2, 1));
                card.addView(itemHeader);
                gap(card, 16);

                LinearLayout actions = row();
                if (item.isVideo) {
                    TextView btnPlay = label("▶ Putar", 13, PRIMARY, true);
                    padding(btnPlay, 16, 10, 16, 10);
                    addRipple(btnPlay, ACCENT, BORDER, 16);

                    btnPlay.setOnClickListener(v -> playVideoWithWatermarkOverlay(item.videoUri, item.dateTime, item.location, item.note));

                    actions.addView(btnPlay);
                } else {
                    TextView btnShare = label("📤 Bagikan", 13, PRIMARY, true);
                    padding(btnShare, 16, 10, 16, 10);
                    addRipple(btnShare, ACCENT, BORDER, 16);
                    btnShare.setOnClickListener(v -> shareImage(item.bitmap));
                    actions.addView(btnShare);
                }
                gap(actions, 12);
                TextView btnDelete = label("🗑 Hapus", 13, Color.parseColor("#EF4444"), true);
                padding(btnDelete, 16, 10, 16, 10);
                addRipple(btnDelete, Color.parseColor("#450A0A"), Color.parseColor("#7F1D1D"), 16);
                btnDelete.setOnClickListener(v -> { historyList.remove(index); toast("Dihapus."); showHistory(); });
                actions.addView(btnDelete);

                card.addView(actions);
                body.addView(card);
                gap(body, 14);
            }
            gap(body, 12);
            body.addView(button("🗑 Kosongkan Semua", false, this::confirmClearHistory));
        }
    }

    private void confirmClearHistory() {
        new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK)
                .setTitle("Hapus Riwayat")
                .setMessage("Yakin ingin menghapus semua?")
                .setPositiveButton("Hapus", (d, w) -> { historyList.clear(); showHistory(); })
                .setNegativeButton("Batal", null).show();
    }

    // ==============================
    // PEMUTAR VIDEO INTERNAL WITH OVERLAY
    // ==============================

    private void playVideoWithWatermarkOverlay(Uri videoUri, String dateTime, String locText, String noteText) {
        FrameLayout playerLayout = new FrameLayout(this);
        playerLayout.setBackgroundColor(Color.BLACK);

        android.widget.VideoView videoView = new android.widget.VideoView(this);
        videoView.setVideoURI(videoUri);

        android.widget.MediaController mediaController = new android.widget.MediaController(this);
        mediaController.setAnchorView(videoView);
        videoView.setMediaController(mediaController);

        playerLayout.addView(videoView, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));

        LinearLayout stampBadge = column();
        stampBadge.setGravity(Gravity.END);

        TextView timeTv = label(dateTime != null ? dateTime : "", 15, Color.WHITE, true);
        timeTv.setGravity(Gravity.END);
        timeTv.setShadowLayer(6f, 2f, 2f, Color.BLACK);
        stampBadge.addView(timeTv);

        if (noteText != null && !noteText.trim().isEmpty()) {
            gap(stampBadge, 3);
            TextView noteTv = label(noteText, 14, Color.WHITE, true);
            noteTv.setGravity(Gravity.END);
            noteTv.setShadowLayer(6f, 2f, 2f, Color.BLACK);
            stampBadge.addView(noteTv);
        }

        if (locText != null && !locText.trim().isEmpty()) {
            gap(stampBadge, 3);
            String formattedLoc = locText.replace(", ", "\n");
            TextView locTv = label(formattedLoc, 13, Color.WHITE, true);
            locTv.setGravity(Gravity.END);
            locTv.setShadowLayer(6f, 2f, 2f, Color.BLACK);
            stampBadge.addView(locTv);
        }

        FrameLayout.LayoutParams badgeParams = new FrameLayout.LayoutParams(-2, -2);
        badgeParams.gravity = Gravity.BOTTOM | Gravity.END;
        badgeParams.bottomMargin = dp(140);
        badgeParams.rightMargin = dp(20);

        playerLayout.addView(stampBadge, badgeParams);
        stampBadge.setElevation(dp(20));
        stampBadge.bringToFront();

        TextView btnClose = label("◀ Kembali", 14, Color.WHITE, true);
        padding(btnClose, 16, 10, 16, 10);
        btnClose.setBackground(rounded(0x88000000, 20));
        btnClose.setOnClickListener(v -> showHistory());

        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(-2, -2);
        closeParams.gravity = Gravity.TOP | Gravity.START;
        closeParams.topMargin = dp(20);
        closeParams.leftMargin = dp(20);

        playerLayout.addView(btnClose, closeParams);
        btnClose.setElevation(dp(20));
        btnClose.bringToFront();

        setContentView(playerLayout);
        videoView.start();
    }

    // ==============================
    // HALAMAN PROFIL
    // ==============================

    private void showProfile() {
        startPage("Profil", "Pengaturan & Info", 3);

        LinearLayout profile = column();
        profile.setGravity(Gravity.CENTER);
        padding(profile, 24, 32, 24, 32);

        TextView avatar = label("U", 32, PRIMARY, true);
        avatar.setGravity(Gravity.CENTER);
        avatar.setBackground(outlined(SURFACE, 60, PRIMARY));

        profile.addView(avatar, params(86, 86));
        gap(profile, 16);

        profile.addView(label("Pengguna TimeStamp Pro", 18, TEXT_DARK, true));
        gap(profile, 6);
        profile.addView(label("Versi Ultimate Dark Mode 1.3", 13, TEXT_MUTED, false));

        addCard(body, profile);
        gap(body, 20);

        sectionTitle(body, "Fitur Aktif");

        LinearLayout infoCard = column();
        padding(infoCard, 18, 18, 18, 18);
        infoCard.setBackground(outlined(SURFACE, 20, BORDER));

        infoCard.addView(label("✦ Watermark Realtime Pojok Kanan Bawah", 14, TEXT_DARK, true)); gap(infoCard, 10);
        infoCard.addView(label("✦ Pemutar Video Internal dengan Overlay", 14, TEXT_DARK, true)); gap(infoCard, 10);
        infoCard.addView(label("✦ Deteksi Lokasi Otomatis Multi-Baris", 14, TEXT_DARK, true)); gap(infoCard, 10);
        infoCard.addView(label("✦ Dukungan Simpan Video & Foto", 14, TEXT_DARK, true));

        body.addView(infoCard);
        gap(body, 28);

        body.addView(button("ℹ Tentang Aplikasi", false, () -> {
            new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK)
                    .setTitle("TimeStamp Pro Ultimate")
                    .setMessage("Aplikasi premium untuk memberikan watermark timestamp profesional pada foto & video Anda.")
                    .setPositiveButton("OK", null).show();
        }));
    }

    // ==============================
    // FLOATING BOTTOM NAVIGATION
    // ==============================

    private View bottomNavigation() {
        LinearLayout nav = row();
        nav.setBackground(outlined(SURFACE, 30, BORDER));
        nav.setElevation(dp(8));
        padding(nav, 6, 8, 6, 8);

        addNavItem(nav, "⌂", "Beranda", 0, this::showHome);
        addNavItem(nav, "📸", "Kamera", 4, this::openRealtimeCamera);
        addNavItem(nav, "✎", "Editor", 1, this::showEditor);
        addNavItem(nav, "◷", "Riwayat", 2, this::showHistory);
        addNavItem(nav, "⚙", "Profil", 3, this::showProfile);

        return nav;
    }

    private void addNavItem(LinearLayout nav, String icon, String title, int index, Runnable action) {
        boolean isActive = (activeTab == index);

        LinearLayout item = column();
        item.setGravity(Gravity.CENTER);
        padding(item, 8, 10, 8, 10);

        if (isActive) {
            item.setBackground(rounded(ACCENT, 20));
        }

        TextView iconText = label(icon, 20, isActive ? PRIMARY : TEXT_MUTED, true);
        iconText.setGravity(Gravity.CENTER);

        TextView labelText = label(title, 11, isActive ? PRIMARY : TEXT_MUTED, isActive);
        labelText.setGravity(Gravity.CENTER);

        item.addView(iconText);
        gap(item, 4);
        item.addView(labelText);

        item.setOnClickListener(view -> action.run());

        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, -2, 1);
        nav.addView(item, p);
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}