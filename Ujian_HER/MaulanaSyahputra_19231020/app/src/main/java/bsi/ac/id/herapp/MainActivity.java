package bsi.ac.id.herapp;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    Button btnBiodata;
    Button btnNilai;
    Button btnTelepon;
    Button btnKeluar;
    TextView txtHasil;

    private final ActivityResultLauncher<Intent> nilaiLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    String nilaiPilihan = result.getData().getStringExtra("hasil_nilai");
                    txtHasil.setText("Hasil : " + nilaiPilihan);
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btnBiodata = findViewById(R.id.btnBiodata);
        btnNilai = findViewById(R.id.btnNilai);
        btnTelepon = findViewById(R.id.btnTelepon);
        btnKeluar = findViewById(R.id.btnKeluar);
        txtHasil = findViewById(R.id.txtHasil);

        btnBiodata.setOnClickListener(v -> {
            Intent intent = new Intent(MainActivity.this, Biodata.class);
            startActivity(intent);
            txtHasil.setText("Hasil : Membuka Menu Data Diri");
        });

        btnNilai.setOnClickListener(v -> {
            Intent intent = new Intent(MainActivity.this, Nilai.class);
            nilaiLauncher.launch(intent);
        });

        btnTelepon.setOnClickListener(v -> {
            String nomorTeman = "0895326153715";
            Intent intent = new Intent(
                    Intent.ACTION_DIAL,
                    Uri.parse("tel:" + nomorTeman)
            );
            startActivity(intent);
            txtHasil.setText("Hasil : Menelpon Teman");
        });

        btnKeluar.setOnClickListener(v -> {
            finishAffinity();
        });
    }
}