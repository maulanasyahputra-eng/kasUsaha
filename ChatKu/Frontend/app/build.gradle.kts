plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.chatku"

    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.example.chatku"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner =
            "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {

    // ========================================
    // ANDROIDX
    // ========================================

    implementation(libs.activity.ktx)

    implementation(libs.appcompat)

    implementation(libs.constraintlayout)

    implementation(libs.material)


    // ========================================
    // RECYCLERVIEW
    // ========================================

    implementation(
        "androidx.recyclerview:recyclerview:1.4.0"
    )


    // ========================================
    // RETROFIT
    // ========================================

    implementation(
        "com.squareup.retrofit2:retrofit:2.11.0"
    )

    implementation(
        "com.squareup.retrofit2:converter-gson:2.11.0"
    )


    // ========================================
    // SOCKET.IO REALTIME CHAT
    // ========================================

    implementation(
        "io.socket:socket.io-client:2.1.0"
    )


    // ========================================
    // TEST
    // ========================================

    testImplementation(
        libs.junit
    )

    androidTestImplementation(
        libs.espresso.core
    )

    androidTestImplementation(
        libs.ext.junit
    )
}
