package bsi.ac.id.herapp;

import android.os.Bundle;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class Biodata extends AppCompatActivity {

    Button btnKembali;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.biodata);

        btnKembali = findViewById(R.id.btnKembali);

        btnKembali.setOnClickListener(v -> {
            finish();
        });
    }
}