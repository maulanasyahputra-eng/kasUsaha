package com.liveku.app;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions;

import java.util.List;
import java.util.Locale;

public class LiveAdapter extends RecyclerView.Adapter<LiveAdapter.LiveViewHolder> {

    private final Context context;
    private final List<LiveItem> liveItems;

    public LiveAdapter(Context context, List<LiveItem> liveItems) {
        this.context = context;
        this.liveItems = liveItems;
    }

    @NonNull
    @Override
    public LiveViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_live, parent, false);
        return new LiveViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LiveViewHolder holder, int position) {
        LiveItem item = liveItems.get(position);

        holder.tvStreamerName.setText(item.getStreamerName());
        holder.tvLiveTitle.setText(item.getLiveTitle());
        holder.tvViewers.setText(formatViewers(item.getViewers()));
        holder.tvLevel.setText("Lv." + item.getStreamerLevel());

        // Load Thumbnail
        Glide.with(context)
                .load(item.getThumbnail())
                .placeholder(android.R.drawable.ic_menu_gallery)
                .error(android.R.drawable.ic_menu_report_image)
                .transition(DrawableTransitionOptions.withCrossFade())
                .into(holder.ivThumbnail);

        holder.itemView.setOnClickListener(v -> {
            if (context instanceof HomeActivity) {
                ((HomeActivity) context).openLiveRoom(item);
            }
        });
    }

    @Override
    public int getItemCount() {
        return liveItems.size();
    }

    private String formatViewers(int viewers) {
        if (viewers >= 1000000) {
            return String.format(Locale.US, "%.1fM", viewers / 1000000.0);
        }
        if (viewers >= 1000) {
            return String.format(Locale.US, "%.1fK", viewers / 1000.0);
        }
        return String.valueOf(viewers);
    }

    static class LiveViewHolder extends RecyclerView.ViewHolder {
        ImageView ivThumbnail;
        TextView tvViewers;
        TextView tvStreamerName;
        TextView tvLiveTitle;
        TextView tvLevel;

        LiveViewHolder(@NonNull View itemView) {
            super(itemView);
            ivThumbnail = itemView.findViewById(R.id.ivThumbnail);
            tvViewers = itemView.findViewById(R.id.tvViewers);
            tvStreamerName = itemView.findViewById(R.id.tvStreamerName);
            tvLiveTitle = itemView.findViewById(R.id.tvLiveTitle);
            tvLevel = itemView.findViewById(R.id.tvLevel);
        }
    }
}
