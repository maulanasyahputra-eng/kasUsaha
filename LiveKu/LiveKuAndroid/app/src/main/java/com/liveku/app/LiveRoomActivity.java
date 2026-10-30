package com.liveku.app;

import android.content.SharedPreferences;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;

public class LiveRoomActivity extends AppCompatActivity {

    private TextView tvStreamerName;
    private TextView tvLiveTitle;
    private TextView tvViewerCount;
    private TextView tvStatus;
    private ImageView ivStreamerAvatar;

    private EditText etComment;

    private Button btnSend;
    private Button btnFollow;
    private Button btnGift;
    private Button btnClose;

    private LinearLayout commentContainer;

    private SharedPreferences preferences;

    private String streamerName;
    private String streamerAvatar;
    private String liveTitle;
    private int viewerCount;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_live_room);

        // ==========================================
        // VIEW
        // ==========================================

        tvStreamerName = findViewById(R.id.tvStreamerName);
        tvLiveTitle = findViewById(R.id.tvLiveTitle);
        tvViewerCount = findViewById(R.id.tvViewerCount);
        tvStatus = findViewById(R.id.tvStatus);
        ivStreamerAvatar = findViewById(R.id.ivStreamerAvatar);

        etComment = findViewById(R.id.etComment);

        btnSend = findViewById(R.id.btnSend);
        btnFollow = findViewById(R.id.btnFollow);
        btnGift = findViewById(R.id.btnGift);
        btnClose = findViewById(R.id.btnClose);

        commentContainer = findViewById(R.id.commentContainer);

        // ==========================================
        // STORAGE
        // ==========================================

        preferences = getSharedPreferences(
                "LiveKu",
                MODE_PRIVATE
        );

        // ==========================================
        // DATA LIVE
        // ==========================================

        streamerName = getIntent().getStringExtra("streamer_name");
        streamerAvatar = getIntent().getStringExtra("streamer_avatar");
        liveTitle = getIntent().getStringExtra("live_title");
        viewerCount = getIntent().getIntExtra("viewer_count", 0);

        if (streamerName == null) streamerName = "Live Host";
        if (liveTitle == null) liveTitle = "Live Streaming";

        // ==========================================
        // TAMPILKAN DATA
        // ==========================================

        tvStreamerName.setText(streamerName);
        tvLiveTitle.setText(liveTitle);
        tvViewerCount.setText("👁 " + viewerCount);
        tvStatus.setText("● LIVE");

        // Load Avatar with Glide
        try {
            Glide.with(this)
                    .load(streamerAvatar)
                    .placeholder(android.R.drawable.ic_menu_report_image)
                    .circleCrop()
                    .into(ivStreamerAvatar);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // ==========================================
        // FOLLOW
        // ==========================================

        btnFollow.setOnClickListener(v -> {
            btnFollow.setText("✓ Mengikuti");
            Toast.makeText(LiveRoomActivity.this, 
                "Berhasil mengikuti " + streamerName, Toast.LENGTH_SHORT).show();
        });

        // ==========================================
        // GIFT
        // ==========================================

        btnGift.setOnClickListener(v -> showGiftDialog());

        // ==========================================
        // SEND COMMENT
        // ==========================================

        btnSend.setOnClickListener(v -> sendComment());

        // ==========================================
        // CLOSE
        // ==========================================

        btnClose.setOnClickListener(v -> finish());

        // ==========================================
        // BACK PRESS
        // ==========================================
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                finish();
            }
        });
    }

    private void sendComment() {
        String comment = etComment.getText().toString().trim();
        if (comment.isEmpty()) return;

        String username = preferences.getString("username", "Pengguna");
        addComment(username, comment);
        etComment.setText("");
    }

    private void showGiftDialog() {
        com.google.android.material.bottomsheet.BottomSheetDialog dialog = 
            new com.google.android.material.bottomsheet.BottomSheetDialog(this);
        View view = getLayoutInflater().inflate(R.layout.dialog_gift, null);
        
        view.findViewById(R.id.giftHeart).setOnClickListener(v -> {
            sendGift("❤️ Cinta");
            dialog.dismiss();
        });

        view.findViewById(R.id.giftRose).setOnClickListener(v -> {
            sendGift("🌹 Mawar");
            dialog.dismiss();
        });

        view.findViewById(R.id.giftDiamond).setOnClickListener(v -> {
            sendGift("💎 Berlian");
            dialog.dismiss();
        });

        view.findViewById(R.id.giftCar).setOnClickListener(v -> {
            sendGift("🏎️ Mobil Balap");
            dialog.dismiss();
        });

        dialog.setContentView(view);
        dialog.show();
    }

    private void sendGift(String giftName) {
        String username = preferences.getString("username", "Pengguna");
        String message = " mengirimkan " + giftName;
        
        TextView textView = new TextView(this);
        SpannableString spannable = new SpannableString(username + message);
        spannable.setSpan(new ForegroundColorSpan(0xFFFFD54F), 0, username.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        spannable.setSpan(new ForegroundColorSpan(0xFFFF4081), username.length(), (username + message).length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        
        textView.setText(spannable);
        textView.setTextColor(0xFFFFFFFF);
        textView.setTextSize(12);
        textView.setPadding(16, 8, 16, 8);
        
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(0x66FF4081);
        gd.setCornerRadius(20f);
        textView.setBackground(gd);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 4, 0, 4);
        textView.setLayoutParams(params);

        commentContainer.addView(textView);
        
        commentContainer.post(() -> {
            View parent = (View) commentContainer.getParent();
            if (parent instanceof ScrollView) {
                ((ScrollView) parent).fullScroll(View.FOCUS_DOWN);
            }
        });

        Toast.makeText(this, "Terima kasih hadiahnya!", Toast.LENGTH_SHORT).show();
    }

    private void addComment(String username, String comment) {
        TextView textView = new TextView(this);
        
        String fullText = username + ": " + comment;
        SpannableString spannable = new SpannableString(fullText);
        spannable.setSpan(new ForegroundColorSpan(0xFFFFD54F), 0, username.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        
        textView.setText(spannable);
        textView.setTextColor(0xFFFFFFFF);
        textView.setTextSize(12);
        textView.setPadding(16, 8, 16, 8);
        
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(0x44000000);
        gd.setCornerRadius(20f);
        textView.setBackground(gd);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 4, 0, 4);
        textView.setLayoutParams(params);

        commentContainer.addView(textView);
        
        commentContainer.post(() -> {
            View parent = (View) commentContainer.getParent();
            if (parent instanceof ScrollView) {
                ((ScrollView) parent).fullScroll(View.FOCUS_DOWN);
            }
        });
    }
}
