import csv
import random
from datetime import datetime, timedelta

# GIỮ NGUYÊN TÊN BIẾN CŨ - Mở rộng thành các thành phần để ghép tổ hợp
names_nam = {
    "ho": ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Trịnh", "Mai", "Quách", "Sử"],
    "dem": ["Văn", "Hữu", "Đức", "Minh", "Quang", "Tùng", "Anh", "Trọng", "Thành", "Gia", "Bảo", "Quốc", "Đình", "Vĩnh", "Phước"],
    "ten": ["Hùng", "Cường", "Dũng", "Tuấn", "Kiên", "Nam", "Phúc", "Lộc", "Thắng", "Tú", "Long", "Thịnh", "Quân", "Hải", "Phong", "Sơn", "Lâm", "Việt", "Hoàng"]
}

names_nu = {
    "ho": ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "An", "Vương", "Lương", "Khưu"],
    "dem": ["Thị", "Ngọc", "Thanh", "Như", "Tuyết", "Mai", "Huyền", "Trúc", "Kim", "Linh", "Phương", "Khánh", "Hồng", "Diệp", "Bảo"],
    "ten": ["An", "Vi", "Thảo", "Ngân", "Bích", "Tiên", "Ngọc", "Nhi", "Hương", "Trinh", "Trang", "Yến", "Đào", "Chi", "Hà", "Lê", "Quyên", "Tâm", "Hạnh"]
}

statuses = ["pending", "consulted", "marketed", "health"]

addresses = [
    "Quận 1, TP.HCM", "Quận 7, TP.HCM", "Quận Bình Thạnh, TP.HCM", "TP. Thủ Đức", 
    "Quận Hoàn Kiếm, Hà Nội", "Quận Cầu Giấy, Hà Nội", "Quận Hai Bà Trưng, Hà Nội",
    "Quận Hải Châu, Đà Nẵng", "Quận Liên Chiểu, Đà Nẵng", "Quận Ninh Kiều, Cần Thơ", 
    "TP. Biên Hòa, Đồng Nai", "TP. Thuận An, Bình Dương", "TP. Vũng Tàu", 
    "TP. Đà Lạt, Lâm Đồng", "TP. Nha Trang, Khánh Hòa", "TP. Buôn Ma Thuột", 
    "TP. Vinh, Nghệ An", "TP. Huế", "TP. Rạch Giá, Kiên Giang", "TP. Quy Nhơn, Bình Định",
    "Huyện Hóc Môn, TP.HCM", "Quận Long Biên, Hà Nội", "TP. Phan Thiết, Bình Thuận"
]

def generate_random_name(gender):
    if gender == "Nam":
        source = names_nam
    elif gender == "Nữ":
        source = names_nu
    else:
        source = random.choice([names_nam, names_nu])
    
    # Tạo ngẫu nhiên tên 3 chữ hoặc 4 chữ
    ho = random.choice(source["ho"])
    dem = random.choice(source["dem"])
    ten = random.choice(source["ten"])
    
    if random.random() > 0.8: # 20% tỉ lệ tên 4 chữ
        dem_phu = random.choice(source["dem"])
        return f"{ho} {dem} {dem_phu} {ten}"
    return f"{ho} {dem} {ten}"

data = []
current_id_base = 1772962000000
start_time = datetime(2026, 1, 1, 8, 0, 0) # Bắt đầu từ đầu năm 2026

for i in range(5000):
    gender = random.choices(["Nam", "Nữ", "Khác"], weights=[48, 48, 4])[0]
    
    record = {
        "id": f"P{current_id_base + i}",
        "name": generate_random_name(gender),
        "birthYear": random.randint(1950, 2010), # Đa dạng từ trẻ em đến người già
        "gender": gender,
        "phone": f"0{random.choice([9, 8, 7, 3, 5])}{random.randint(10000000, 99999999)}",
        "address": random.choice(addresses),
        "consent": "TRUE",
        "status": statuses[0], #random.choice(statuses),
        # Tạo thời gian ngẫu nhiên rải rác trong 3 tháng đầu năm 2026
        "createdAt": (start_time + timedelta(minutes=random.randint(1, 100000))).isoformat()[:23] + "Z"
    }
    data.append(record)

# Ghi file CSV
filename = 'test_data_5000.csv'
with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)

print(f"Hoàn thành! Đã tạo {len(data)} records tại file: {filename}")