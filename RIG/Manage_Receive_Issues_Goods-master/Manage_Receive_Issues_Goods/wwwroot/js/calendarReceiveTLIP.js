﻿document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    // PARSE SANG ĐỊNH ISO 8601
    function getFormattedNow() {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    //Lấy thời gian thực cho Indicator
    var now = getFormattedNow();

    //Hàm để lấy nhà cung cấp cho hôm nay
    function loadSuppliersForToday() {
        fetch('/TLIPWarehouse/GetSuppliersForToday')
            .then(response => response.json())
            .then(data => {
                var suppliersHTML = '';
                data.forEach(supplier => {
                    suppliersHTML += `<div class="supplier-block">${supplier.supplierName}</div>`;
                });
                document.getElementById('suppliersListContent').innerHTML = suppliersHTML;
            });
    }

    // HÀM GỌI API ĐỂ LẤY CÁC STAGE CỦA SỰ KIỆN
    function loadEventStages(eventId) {
        //return fetch(`/api/TaskStages/${eventId}`) // Gọi API lấy giai đoạn dựa vào event ID
        return fetch(`/api/StagesIssuedDenso/1`) // Gọi API lấy dữ liệu demo
            .then(response => response.json())
            .then(data => {
                var stagesHTML = '';
                data.forEach(stage => {
                    stagesHTML += `
                        <tr>
                            <td></td>
                            <td></td>
                            
                        </tr>`;
                });
                document.getElementById('stagesTableBody').innerHTML = stagesHTML; // Hiển thị các giai đoạn trong modal
            });
    }

    //KHỞI TẠO LỊCH
    var calendar = new FullCalendar.Calendar(calendarEl, {
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        initialView: 'resourceTimelineDay',
        // Mỗi slot là 30 phút
        slotDuration: '00:30',
        // Mỗi slot cách nhau 1 tiếng
        slotLabelInterval: '01:00',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Sử dụng định dạng 24 giờ
        },
        // Hiển thị các ô thời gian từ 6 giờ sáng hôm trước đến 6 giờ sáng hôm sau
        slotMinTime: '06:00:00',
        slotMaxTime: '30:00:00',
        stickyFooterScrollbar: 'auto',
        resourceAreaWidth: '110px',
        //Gọi Indicator
        nowIndicator: true,
        //set Indicator với thời gian thực
        now: now,
        timeZone: 'Asia/Bangkok',
        locale: 'en-GB',
        aspectRatio: 2.0,
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek'
        },
        editable: false,
        resourceAreaHeaderContent: 'Details/Hour',
        //Lấy API để hiển thị cột Actual và Plan
        resources: '/api/Resources',
        //Sắp xếp theo thứ tự theo order(Plan trước Actual sau)
        resourceOrder: 'order',
        events: '/TLIPWarehouse/GetPlanAndActualEvents',
        // Không cho phép kéo sự kiện để thay đổi thời gian bắt đầu
        eventStartEditable: false,
        // Không cho phép thay đổi độ dài (thời lượng) sự kiện
        eventDurationEditable: false,
        //Hover viền khi di chuột 
        eventMouseEnter: function (info) {
            info.el.classList.add('highlighted-event');
        },
        eventMouseLeave: function (info) {
            info.el.classList.remove('highlighted-event');
        },
        resourceLabelClassNames: function (arg) {
            return ['custom-resource-label'];
        },

        //HÀM XỬ LÝ KHI CLICK VÀO SỰ KIỆN
        eventClick: function (info) {
            var start = new Date(info.event.start);
            var end = new Date(info.event.end);

            // Định dạng thời gian bắt đầu và kết thúc theo dạng ' HH:mm'
            var formattedStart = start.toLocaleString('vi-VN', {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit'
            });

            var formattedEnd = end.toLocaleString('vi-VN', {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Đưa dữ liệu sự kiện vào modal
            document.getElementById('eventDetails').innerText = `Nhà cung cấp: ${info.event.title}\nBắt đầu: ${formattedStart}\nKết thúc: ${formattedEnd}`;

            // Kiểm tra nếu sự kiện thuộc "Actual" row
            const isActual = info.event.getResources().some(resource => resource.title === "Actual");

            // Gọi API để tải các giai đoạn của sự kiện nếu là Actual
            if (isActual) {
                loadEventStages(info.event.id);
                document.getElementById('stagesTable').style.display = 'table';
            } else {
                document.getElementById('stagesTable').style.display = 'none';
            }

            // Hiển thị hoặc ẩn nút Delay
            const delayButton = document.getElementById('delayButton');
            const supplierName = info.event.title;

            // Kiểm tra xem có event "Actual" nào cho cùng supplier không
            const hasActualEvent = calendar.getEvents().some(event => {
                return event.title === supplierName && event.getResources().some(resource => resource.title === "Actual");
            });

            if (!isActual && !hasActualEvent) {
                delayButton.style.display = 'block';
                document.getElementById('eventModal').setAttribute('data-actual', info.event.id);
            } else {
                delayButton.style.display = 'none';
            }

            // Hiển thị modal với các giai đoạn và nút điều khiển
            var myModal = new bootstrap.Modal(document.getElementById('eventModal'));
            myModal.show();
        },
        //FOMAT NGÀY THÁNG
        views: {
            resourceTimelineDay: {
                titleFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
            },
            resourceTimelineWeek: {
                titleFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
            }
        },
        resourceLaneClassNames: function (arg) {
            if (arg.resource.title === "Actual") {
                return ['gray-background'];
            }
            return [];
        },
        resourceLabelClassNames: function (arg) {
            if (arg.resource.title === "Actual") {
                return ['gray-background'];
            }
            return [];
        },
        eventContent: function (arg) {
            let content = document.createElement('div');
            content.classList.add('centered-event');
            content.innerHTML = arg.event.title;
            return { domNodes: [content] };
        },
        slotLabelContent: function (arg) {
            return { html: `<i style="color: blue; text-decoration: none;">${arg.text}</i>` };
        },
        slotLabelClassNames: function (arg) {
            return ['custom-slot-label'];
        }

    });

    calendar.render();
    //Tải nhà cung cấp lên khi tải trang 
    loadSuppliersForToday();

    //HIỂN THỊ THỜI GIAN THỰC
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}:${seconds}`;
        document.getElementById('currentTime').textContent = currentTime;
    }
    setInterval(updateTime, 1000);
    updateTime();

    //HÀM XỬ LÝ SỰ KIỆN KHI ẤN DELAY
    document.getElementById('delayButton').addEventListener('click', async function () {
        const supplierId = document.getElementById('eventModal').getAttribute('data-actual');
        console.log("supplierId:", supplierId);
        const response = await fetch('/api/tlipwarehouse/delaySupplier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(supplierId)
        });

        const data = await response.json();
        if (data.success) {
            console.log('Delay processed successfully.');
        } else {
            console.error('Failed to process delay.');
        }
    });
});
