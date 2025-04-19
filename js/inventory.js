$(document).ready(function () {
    const inventoryCategories = ["Grocery", "Furniture", "Appliances", "Cleaning", "Kitchen"];

    function loadInventoryGroups() {
        const groupDropdown = $("#inventory-group-select");
        const modalDropdown = $("#inventory-group-select-modal");
        const userEmail = localStorage.getItem("userEmail");

        groupDropdown.empty().append(`<option value="">-- Select Group --</option>`);
        modalDropdown.empty().append(`<option value="">-- Select Group --</option>`);

        db.collection("groups")
            .where("members", "array-contains", userEmail)
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const option = `<option value="${doc.id}">${doc.data().name}</option>`;
                    groupDropdown.append(option);
                    modalDropdown.append(option);
                });
            });
    }

    function loadInventoryItems(groupId) {
        const listContainer = $("#inventory-list");
        listContainer.empty();

        db.collection("inventory")
            .where("groupId", "==", groupId)
            .get()
            .then(snapshot => {
                const categorized = {};

                snapshot.forEach(doc => {
                    const item = doc.data();
                    if (!categorized[item.category]) categorized[item.category] = [];
                    categorized[item.category].push({ ...item, id: doc.id });
                });

                for (const category in categorized) {
                    const categorySection = $(`
              <li class="inventory-category">
                <h4>${category}</h4>
                <ul class="inventory-items"></ul>
              </li>
            `);
                    categorized[category].forEach(item => {
                        categorySection.find(".inventory-items").append(`
                <li class="inventory-item">
                  <span>${item.name} (x${item.quantity}) - $${item.cost}</span>
                  <span class="delete-inventory" data-id="${item.id}">🗑️</span>
                </li>
              `);
                    });
                    listContainer.append(categorySection);
                }
            });
    }

    function addInventoryItem(itemData) {
        if (navigator.onLine) {
            return db.collection("inventory").add(itemData);
        } else {
            return dbPromise.then(localDB => {
                return localDB.add("sync-inventory", itemData).then(() => {
                    return navigator.serviceWorker.ready.then(sw => sw.sync.register("sync-inventory"));
                });
            });
        }
    }

    // Group selection
    $("#inventory-group-select").on("change", function () {
        const groupId = $(this).val();
        if (groupId) loadInventoryItems(groupId);
    });

    // Open and Close Modal
    $("#open-add-inventory-modal").on("click", () => $("#inventory-modal").removeClass("hidden"));
    $("#cancel-inventory-modal").on("click", () => $("#inventory-modal").addClass("hidden"));

    // Add Item Form Submit
    $("#inventory-form").on("submit", function (e) {
        e.preventDefault();
        const itemData = {
            groupId: $("#inventory-group-select-modal").val(),
            category: $("#inventory-category").val(),
            name: $("#item-name").val(),
            quantity: parseInt($("#item-quantity").val(), 10),
            cost: parseFloat($("#item-cost").val()),
            timestamp: Date.now()
        };

        addInventoryItem(itemData).then(() => {
            $("#inventory-modal").addClass("hidden");
            this.reset();

            const currentGroup = $("#inventory-group-select").val();
            if (currentGroup === itemData.groupId) {
                loadInventoryItems(currentGroup);
            }


            if ('Notification' in window && Notification.permission === "granted") {
                new Notification("Hive Update", {
                    body: "New inventory item added!",
                    icon: "assets/icons/web-app-manifest-192x192.png"
                });
            }
        });
    });

    // Delete item
    $("#inventory-list").on("click", ".delete-inventory", function () {
        const id = $(this).data("id");
        db.collection("inventory").doc(id).delete().then(() => {
            $(this).closest("li").remove();
        });
    });

    // Initial Load
    loadInventoryGroups();
});
