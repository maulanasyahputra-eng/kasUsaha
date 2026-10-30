package com.liveku.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class SearchActivity extends AppCompatActivity {

    private EditText etSearch;
    private TextView btnSearch;
    private Button btnBack;
    private LinearLayout resultContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search);

        etSearch = findViewById(R.id.etSearch);
        btnSearch = findViewById(R.id.btnSearch);
        btnBack = findViewById(R.id.btnBack);
        resultContainer = findViewById(R.id.resultContainer);

        btnBack.setOnClickListener(v -> finish());

        btnSearch.setOnClickListener(v -> {
            String keyword = etSearch.getText().toString().trim();
            searchHost(keyword);
        });

        searchHost("");
    }

    private void searchHost(String keyword) {
        resultContainer.removeAllViews();
        // Simulasi data hasil pencarian
        if (keyword.isEmpty() || "Host".toLowerCase().contains(keyword.toLowerCase())) {
            addResult("Host Populer", "Sedang berbagi keseruan!", 1250);
        }
        if (keyword.isEmpty() || "Live".toLowerCase().contains(keyword.toLowerCase())) {
            addResult("Live Gaming", "Push rank Mobile Legends", 850);
        }
    }

    private void addResult(String name, String title, int viewers) {
        View card = getLayoutInflater().inflate(R.layout.item_live, resultContainer, false);

        TextView tvName = card.findViewById(R.id.tvStreamerName);
        TextView tvTitle = card.findViewById(R.id.tvLiveTitle);
        TextView tvViewCount = card.findViewById(R.id.tvViewers);
        TextView tvLevel = card.findViewById(R.id.tvLevel);

        if (tvName != null) tvName.setText(name);
        if (tvTitle != null) tvTitle.setText(title);
        if (tvViewCount != null) tvViewCount.setText(String.valueOf(viewers));
        if (tvLevel != null) tvLevel.setText("Lv.1");

        card.setOnClickListener(v -> {
            Intent intent = new Intent(SearchActivity.this, LiveRoomActivity.class);
            intent.putExtra("streamer_name", name);
            intent.putExtra("live_title", title);
            intent.putExtra("viewer_count", viewers);
            startActivity(intent);
        });

        resultContainer.addView(card);
    }
}
