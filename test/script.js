document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const cheatSections = document.querySelectorAll(".cheat-section");
    const cards = document.querySelectorAll(".card");
    const listItems = document.querySelectorAll(".card li");

    // 1. FUNGSI FILTER TAB (ALL / HTML / CSS / JS)
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const target = button.getAttribute("data-target");

            cheatSections.forEach(section => {
                const category = section.getAttribute("data-category");
                if (target === "all" || category === target) {
                    section.style.display = "block";
                } else {
                    section.style.display = "none";
                }
            });
        });
    });

    // 2. FUNGSI PENCARIAN REAL-TIME
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();

        listItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });

        cards.forEach(card => {
            const visibleItems = card.querySelectorAll("li[style*='display: flex']");
            const allItems = card.querySelectorAll("li");

            if (query === "") {
                card.style.display = "block";
                allItems.forEach(item => item.style.display = "flex");
            } else if (visibleItems.length === 0) {
                card.style.display = "none";
            } else {
                card.style.display = "block";
            }
        });

        cheatSections.forEach(section => {
            const visibleCards = section.querySelectorAll(".card[style*='display: block']");
            if (query !== "" && visibleCards.length === 0) {
                section.style.display = "none";
            } else {
                const activeTab = document.querySelector(".tab-btn.active").getAttribute("data-target");
                const category = section.getAttribute("data-category");
                if (activeTab === "all" || activeTab === category) {
                    section.style.display = "block";
                }
            }
        });
    });

    // 3. EFEK MENGE CILKAN SEARCH BAR SAAT DI-SCROLL
    window.addEventListener("scroll", () => {
        const header = document.querySelector(".main-header");
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
});