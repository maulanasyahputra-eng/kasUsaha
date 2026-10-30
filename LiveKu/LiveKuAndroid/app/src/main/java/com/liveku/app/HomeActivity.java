package com.liveku.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.liveku.app.network.ApiClient;
import com.liveku.app.network.ApiService;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeActivity extends AppCompatActivity {

    // ==========================================
    // HEADER
    // ==========================================

    private TextView tvUsername;
    private TextView tvCoin;
    private TextView btnSearch;

    // ==========================================
    // NAVIGATION
    // ==========================================

    private LinearLayout btnHome;
    private LinearLayout btnLive;
    private LinearLayout btnWallet;
    private LinearLayout btnProfile;

    // ==========================================
    // LIVE
    // ==========================================

    private RecyclerView rvLive;
    private TextView tvLiveCount;
    private TextView tvEmptyLive;

    private LiveAdapter liveAdapter;

    private final List<LiveItem> liveItems =
            new ArrayList<>();

    // ==========================================
    // API
    // ==========================================

    private ApiService apiService;

    // ==========================================
    // STORAGE
    // ==========================================

    private SharedPreferences preferences;


    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_home);

        // ==========================================
        // VIEW
        // ==========================================

        tvUsername =
                findViewById(R.id.tvUsername);

        tvCoin =
                findViewById(R.id.tvCoin);

        btnSearch =
                findViewById(R.id.btnSearch);

        btnHome =
                findViewById(R.id.btnHome);

        btnLive =
                findViewById(R.id.btnLive);

        btnWallet =
                findViewById(R.id.btnWallet);

        btnProfile =
                findViewById(R.id.btnProfile);

        rvLive =
                findViewById(R.id.rvLive);

        tvLiveCount =
                findViewById(R.id.tvLiveCount);

        tvEmptyLive =
                findViewById(R.id.tvEmptyLive);


        // ==========================================
        // STORAGE
        // ==========================================

        preferences =
                getSharedPreferences(
                        "LiveKu",
                        MODE_PRIVATE
                );


        // ==========================================
        // API (PERBAIKAN DI SINI)
        // ==========================================

        apiService = ApiClient.getApiService();


        // ==========================================
        // USER
        // ==========================================

        loadUser();

        // KLIK KOIN -> KE WALLET
        tvCoin.setOnClickListener(v -> {
            Intent intent = new Intent(HomeActivity.this, WalletActivity.class);
            startActivity(intent);
        });

        // ==========================================
        // RECYCLER VIEW
        // ==========================================

        setupLiveRecycler();


        // ==========================================
        // LOAD LIVE
        // ==========================================

        loadLiveRooms();


        // ==========================================
        // SEARCH
        // ==========================================

        btnSearch.setOnClickListener(v -> {

            Intent intent =
                    new Intent(
                            HomeActivity.this,
                            SearchActivity.class
                    );

            startActivity(intent);
        });


        // ==========================================
        // HOME
        // ==========================================

        btnHome.setOnClickListener(v -> {

            loadLiveRooms();

            Toast.makeText(
                    HomeActivity.this,
                    "Live diperbarui",
                    Toast.LENGTH_SHORT
            ).show();
        });


        // ==========================================
        // LIVE
        // ==========================================

        btnLive.setOnClickListener(v -> {

            loadLiveRooms();
        });


        // ==========================================
        // WALLET
        // ==========================================

        btnWallet.setOnClickListener(v -> {

            Intent intent =
                    new Intent(
                            HomeActivity.this,
                            WalletActivity.class
                    );

            startActivity(intent);
        });


        // ==========================================
        // PROFILE
        // ==========================================

        btnProfile.setOnClickListener(v -> {

            Intent intent =
                    new Intent(
                            HomeActivity.this,
                            ProfileActivity.class
                    );

            startActivity(intent);
        });
    }


    // ==========================================
    // SETUP RECYCLER
    // ==========================================

    private void setupLiveRecycler() {

        GridLayoutManager layoutManager =
                new GridLayoutManager(
                        this,
                        2
                );

        rvLive.setLayoutManager(
                layoutManager
        );

        rvLive.setHasFixedSize(false);

        liveAdapter =
                new LiveAdapter(
                        this,
                        liveItems
                );

        rvLive.setAdapter(
                liveAdapter
        );
    }


    // ==========================================
    // LOAD USER
    // ==========================================

    private void loadUser() {

        String username =
                preferences.getString(
                        "username",
                        "Pengguna"
                );

        int coin =
                preferences.getInt(
                        "coin_balance",
                        0
                );

        tvUsername.setText(
                username
        );

        tvCoin.setText(
                formatNumber(coin)
                        + " Coin"
        );
    }


    // ==========================================
    // LOAD LIVE ROOMS
    // ==========================================

    private void loadLiveRooms() {

        apiService
                .getLiveRooms()
                .enqueue(
                        new Callback<JsonObject>() {

                            @Override
                            public void onResponse(
                                    Call<JsonObject> call,
                                    Response<JsonObject> response
                            ) {

                                if (!response.isSuccessful()
                                        || response.body() == null) {

                                    showEmptyLive(
                                            "Gagal mengambil data live"
                                    );

                                    return;
                                }

                                try {

                                    JsonObject body =
                                            response.body();

                                    if (!body.has("success")
                                            || !body
                                            .get("success")
                                            .getAsBoolean()) {

                                        showEmptyLive(
                                                "Data live tidak tersedia"
                                        );

                                        return;
                                    }


                                    if (!body.has("data")
                                            || body
                                            .get("data")
                                            .isJsonNull()) {

                                        showEmptyLive(
                                                "Belum ada host yang live"
                                        );

                                        return;
                                    }


                                    JsonArray data =
                                            body
                                                    .getAsJsonArray(
                                                            "data"
                                                    );


                                    liveItems.clear();


                                    for (
                                            int i = 0;
                                            i < data.size();
                                            i++
                                    ) {

                                        JsonObject item =
                                                data.get(i)
                                                        .getAsJsonObject();


                                        long roomId =
                                                getLong(
                                                        item,
                                                        "id",
                                                        0
                                                );


                                        long hostId =
                                                getLong(
                                                        item,
                                                        "host_id",
                                                        0
                                                );


                                        String title =
                                                getString(
                                                        item,
                                                        "title",
                                                        "Live Streaming"
                                                );


                                        String status =
                                                getString(
                                                        item,
                                                        "status",
                                                        "LIVE"
                                                );


                                        int viewers =
                                                (int) getLong(
                                                        item,
                                                        "viewer_count",
                                                        0
                                                );


                                        String streamerName =
                                                getString(
                                                        item,
                                                        "username",
                                                        ""
                                                );

                                        if (
                                                streamerName
                                                        .isEmpty()
                                        ) {
                                            streamerName =
                                                    getString(
                                                            item,
                                                            "name",
                                                            ""
                                                    );
                                        }

                                        if (
                                                streamerName
                                                        .isEmpty()
                                        ) {
                                            streamerName =
                                                    "Host "
                                                            + hostId;
                                        }

                                        String streamerAvatar =
                                                getString(
                                                        item,
                                                        "avatar",
                                                        ""
                                                );

                                        String thumbnail =
                                                getString(
                                                        item,
                                                        "thumbnail",
                                                        ""
                                                );

                                        int level =
                                                (int) getLong(
                                                        item,
                                                        "level",
                                                        1
                                                );

                                        String country =
                                                getString(
                                                        item,
                                                        "country",
                                                        "ID"
                                                );

                                        LiveItem liveItem =
                                                new LiveItem(
                                                        roomId,
                                                        hostId,
                                                        streamerName,
                                                        streamerAvatar,
                                                        title,
                                                        thumbnail,
                                                        status,
                                                        viewers,
                                                        level,
                                                        country
                                                );


                                        liveItems.add(
                                                liveItem
                                        );
                                    }


                                    liveAdapter
                                            .notifyDataSetChanged();


                                    updateLiveCount();


                                    if (
                                            liveItems.isEmpty()
                                    ) {

                                        showEmptyLive(
                                                "Belum ada host yang sedang live"
                                        );

                                    } else {

                                        rvLive.setVisibility(
                                                View.VISIBLE
                                        );

                                        tvEmptyLive.setVisibility(
                                                View.GONE
                                        );
                                    }


                                } catch (Exception e) {

                                    e.printStackTrace();

                                    showEmptyLive(
                                            "Format data live tidak sesuai"
                                    );
                                }
                            }


                            @Override
                            public void onFailure(
                                    Call<JsonObject> call,
                                    Throwable t
                            ) {

                                t.printStackTrace();

                                showEmptyLive(
                                        "Backend tidak dapat dihubungi"
                                );
                            }
                        }
                );
    }


    // ==========================================
    // LIVE COUNT
    // ==========================================

    private void updateLiveCount() {

        tvLiveCount.setText(
                liveItems.size()
                        + " Live"
        );
    }


    // ==========================================
    // EMPTY LIVE
    // ==========================================

    private void showEmptyLive(
            String message
    ) {

        liveItems.clear();

        if (liveAdapter != null) {

            liveAdapter.notifyDataSetChanged();
        }

        tvLiveCount.setText(
                "0 Live"
        );

        tvEmptyLive.setText(
                message
        );

        tvEmptyLive.setVisibility(
                View.VISIBLE
        );

        rvLive.setVisibility(
                View.GONE
        );
    }


    // ==========================================
    // OPEN LIVE ROOM
    // ==========================================

    public void openLiveRoom(
            LiveItem item
    ) {

        if (item == null) {

            Toast.makeText(
                    HomeActivity.this,
                    "Data live tidak ditemukan",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        Intent intent =
                new Intent(
                        HomeActivity.this,
                        LiveRoomActivity.class
                );


        intent.putExtra(
                "room_id",
                item.getRoomId()
        );


        intent.putExtra(
                "host_id",
                item.getHostId()
        );


        intent.putExtra(
                "streamer_name",
                item.getStreamerName()
        );

        intent.putExtra(
                "streamer_avatar",
                item.getStreamerAvatar()
        );


        intent.putExtra(
                "live_title",
                item.getLiveTitle()
        );


        intent.putExtra(
                "viewer_count",
                item.getViewers()
        );


        startActivity(
                intent
        );
    }


    // ==========================================
    // SAFE STRING
    // ==========================================

    private String getString(
            JsonObject object,
            String key,
            String defaultValue
    ) {

        try {

            if (
                    object.has(key)
                            && !object
                            .get(key)
                            .isJsonNull()
            ) {

                return object
                        .get(key)
                        .getAsString();
            }

        } catch (Exception ignored) {
        }

        return defaultValue;
    }


    // ==========================================
    // SAFE LONG
    // ==========================================

    private long getLong(
            JsonObject object,
            String key,
            long defaultValue
    ) {

        try {

            if (
                    object.has(key)
                            && !object
                            .get(key)
                            .isJsonNull()
            ) {

                return object
                        .get(key)
                        .getAsLong();
            }

        } catch (Exception ignored) {
        }

        return defaultValue;
    }


    // ==========================================
    // FORMAT NUMBER
    // ==========================================

    private String formatNumber(
            int number
    ) {

        return String.format(
                Locale.US,
                "%,d",
                number
        ).replace(
                ",",
                "."
        );
    }


    // ==========================================
    // REFRESH
    // ==========================================

    @Override
    protected void onResume() {

        super.onResume();

        loadUser();

        if (apiService != null) {

            loadLiveRooms();
        }
    }
}