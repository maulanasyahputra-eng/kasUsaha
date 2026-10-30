package com.example.chatku.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.R;
import com.example.chatku.model.UserResponse;

import java.util.List;

public class UserAdapter
        extends RecyclerView.Adapter<UserAdapter.UserViewHolder> {


    // =========================================
    // DATA
    // =========================================

    private final List<UserResponse.User> users;


    // =========================================
    // CLICK LISTENER
    // =========================================

    private final OnUserClickListener listener;


    // =========================================
    // INTERFACE
    // =========================================

    public interface OnUserClickListener {

        void onUserClick(
                UserResponse.User user
        );

    }


    // =========================================
    // CONSTRUCTOR
    // =========================================

    public UserAdapter(
            List<UserResponse.User> users,
            OnUserClickListener listener
    ) {

        this.users = users;

        this.listener = listener;

    }


    // =========================================
    // CREATE VIEW HOLDER
    // =========================================

    @NonNull
    @Override
    public UserViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {

        View view =
                LayoutInflater.from(
                        parent.getContext()
                ).inflate(
                        R.layout.item_user,
                        parent,
                        false
                );


        return new UserViewHolder(view);

    }


    // =========================================
    // BIND DATA
    // =========================================

    @Override
    public void onBindViewHolder(
            @NonNull UserViewHolder holder,
            int position
    ) {

        UserResponse.User user =
                users.get(position);


        /* =====================================
           DISPLAY NAME
        ===================================== */

        String displayName =
                user.getDisplayName();


        if (
                displayName == null ||
                        displayName.trim().isEmpty()
        ) {

            displayName =
                    "Pengguna ChatKu";

        }


        holder.nameText.setText(
                displayName
        );


        /* =====================================
           USERNAME
        ===================================== */

        String username =
                user.username;


        if (
                username != null &&
                        !username.trim().isEmpty()
        ) {

            username =
                    username.trim();


            /*
             * Tampilkan @username
             */

            if (
                    !username.startsWith("@")
            ) {

                username =
                        "@" + username;

            }


            holder.usernameText.setText(
                    username
            );

            holder.usernameText.setVisibility(
                    View.VISIBLE
            );

        } else {

            holder.usernameText.setText(
                    ""
            );

            holder.usernameText.setVisibility(
                    View.GONE
            );

        }


        /* =====================================
           PHONE
        ===================================== */

        String phone =
                user.phone;


        if (
                phone != null &&
                        !phone.trim().isEmpty()
        ) {

            holder.phoneText.setText(
                    phone
            );

            holder.phoneText.setVisibility(
                    View.VISIBLE
            );

        } else {

            holder.phoneText.setText(
                    ""
            );

            holder.phoneText.setVisibility(
                    View.GONE
            );

        }


        /* =====================================
           VERIFIED
        ===================================== */

        if (
                user.isVerified()
        ) {

            holder.verifiedIcon.setVisibility(
                    View.VISIBLE
            );

        } else {

            holder.verifiedIcon.setVisibility(
                    View.GONE
            );

        }


        /* =====================================
           CLICK
        ===================================== */

        holder.itemView.setOnClickListener(
                v -> {

                    if (
                            listener != null
                    ) {

                        listener.onUserClick(
                                user
                        );

                    }

                }
        );

    }


    // =========================================
    // ITEM COUNT
    // =========================================

    @Override
    public int getItemCount() {

        return users == null
                ? 0
                : users.size();

    }


    // =========================================
    // VIEW HOLDER
    // =========================================

    static class UserViewHolder
            extends RecyclerView.ViewHolder {


        TextView nameText;

        TextView usernameText;

        TextView phoneText;

        ImageView verifiedIcon;


        UserViewHolder(
                @NonNull View itemView
        ) {

            super(itemView);


            nameText =
                    itemView.findViewById(
                            R.id.nameText
                    );


            usernameText =
                    itemView.findViewById(
                            R.id.usernameText
                    );


            phoneText =
                    itemView.findViewById(
                            R.id.phoneText
                    );


            verifiedIcon =
                    itemView.findViewById(
                            R.id.verifiedIcon
                    );

        }

    }

}