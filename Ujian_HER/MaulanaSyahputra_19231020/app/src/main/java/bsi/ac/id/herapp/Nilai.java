package bsi.ac.id.herapp;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class Nilai extends AppCompatActivity {

    RadioGroup radioGroupNilai;
    Button btnPilih;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.nilai);

        radioGroupNilai = findViewById(R.id.radioGroupNilai);
        btnPilih = findViewById(R.id.btnPilih);

        btnPilih.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int selectedId = radioGroupNilai.getCheckedRadioButtonId();

                if (selectedId != -1) {
                    RadioButton selectedRadioButton = findViewById(selectedId);
                    String nilaiTerpilih = selectedRadioButton.getText().toString();

                    Intent intent = new Intent();
                    intent.putExtra("hasil_nilai", nilaiTerpilih);
                    setResult(RESULT_OK, intent);
                    finish(); // Tutup halaman Nilai dan kembali ke Menu Utama
                } else {
                    Toast.makeText(Nilai.this, "Silakan pilih nilai terlebih dahulu!", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}