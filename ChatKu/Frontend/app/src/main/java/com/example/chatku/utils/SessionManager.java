package com.example.chatku.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {

    private static final String PREF_NAME =
            "ChatKuSession";

    private static final String KEY_TOKEN =
            "token";

    private static final String KEY_USER_ID =
            "user_id";

    private static final String KEY_PHONE =
            "phone";

    private final SharedPreferences preferences;


    public SessionManager(Context context) {

        preferences =
                context.getSharedPreferences(
                        PREF_NAME,
                        Context.MODE_PRIVATE
                );
    }


    public void saveSession(
            String token,
            long userId,
            String phone
    ) {

        preferences.edit()
                .putString(
                        KEY_TOKEN,
                        token
                )
                .putLong(
                        KEY_USER_ID,
                        userId
                )
                .putString(
                        KEY_PHONE,
                        phone
                )
                .apply();
    }


    public String getToken() {

        return preferences.getString(
                KEY_TOKEN,
                null
        );
    }


    public long getUserId() {

        return preferences.getLong(
                KEY_USER_ID,
                0
        );
    }


    public String getPhone() {

        return preferences.getString(
                KEY_PHONE,
                null
        );
    }


    public boolean isLoggedIn() {

        String token =
                getToken();

        return token != null
                && !token.isEmpty();
    }


    public void logout() {

        preferences.edit()
                .clear()
                .apply();
    }
}