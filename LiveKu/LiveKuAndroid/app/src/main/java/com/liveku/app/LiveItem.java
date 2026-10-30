package com.liveku.app;

public class LiveItem {

    private long roomId;
    private long hostId;
    private String streamerName;
    private String streamerAvatar;
    private String liveTitle;
    private String thumbnail;
    private String status;
    private int viewers;
    private int streamerLevel;
    private String country;

    public LiveItem(
            long roomId,
            long hostId,
            String streamerName,
            String streamerAvatar,
            String liveTitle,
            String thumbnail,
            String status,
            int viewers,
            int streamerLevel,
            String country
    ) {
        this.roomId = roomId;
        this.hostId = hostId;
        this.streamerName = streamerName;
        this.streamerAvatar = streamerAvatar;
        this.liveTitle = liveTitle;
        this.thumbnail = thumbnail;
        this.status = status;
        this.viewers = viewers;
        this.streamerLevel = streamerLevel;
        this.country = country;
    }

    // ==========================================
    // GETTERS & SETTERS
    // ==========================================

    public long getRoomId() { return roomId; }
    public void setRoomId(long roomId) { this.roomId = roomId; }

    public long getHostId() { return hostId; }
    public void setHostId(long hostId) { this.hostId = hostId; }

    public String getStreamerName() { return streamerName; }
    public void setStreamerName(String streamerName) { this.streamerName = streamerName; }

    public String getStreamerAvatar() { return streamerAvatar; }
    public void setStreamerAvatar(String streamerAvatar) { this.streamerAvatar = streamerAvatar; }

    public String getLiveTitle() { return liveTitle; }
    public void setLiveTitle(String liveTitle) { this.liveTitle = liveTitle; }

    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getViewers() { return viewers; }
    public void setViewers(int viewers) { this.viewers = viewers; }

    public int getStreamerLevel() { return streamerLevel; }
    public void setStreamerLevel(int streamerLevel) { this.streamerLevel = streamerLevel; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
