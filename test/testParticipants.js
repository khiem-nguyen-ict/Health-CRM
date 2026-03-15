// Test function to add 100 random participants with 100ms delay
async function addRandomParticipantsTest() {
  console.log("Starting to add 100 random participants...");

  const firstNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
  ];
  const middleNames = [
    "Văn",
    "Thị",
    "Đình",
    "Quốc",
    "Trọng",
    "Hữu",
    "Đức",
    "Xuân",
    "Mai",
    "Hùng",
    "Hà",
    "Bình",
    "Thanh",
    "An",
    "Tuấn",
  ];
  const lastNames = [
    "An",
    "Bình",
    "Cường",
    "Dũng",
    "Đạt",
    "Giang",
    "Hoa",
    "Khanh",
    "Linh",
    "Mai",
    "Nam",
    "Phương",
    "Quỳnh",
    "Sơn",
    "Tài",
    "Thảo",
    "Trang",
    "Tuấn",
    "Uyên",
    "Vy",
  ];
  const streets = ["Ngõ", "Phố", "Đường", "Boulevard", "Avenue", "Street"];
  const streetNames = [
    "Hà Nội",
    "Sài Gòn",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "Huế",
    "Nha Trang",
    "Đà Lạt",
    "Vũng Tàu",
    "Hội An",
  ];
  const wards = ["Phường", "Xã", "Thị trấn"];
  const wardNames = [
    "Bến Thành",
    "Đa Kao",
    "Bình Thạnh",
    "Tân Bình",
    "Bình Tân",
    "Gò Vấp",
    "Tân Phú",
    "Bình Tân",
  ];
  const districts = ["Quận", "Huyện", "Thị xã"];
  const districtNames = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  function generateRandomName() {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const middle = middleNames[Math.floor(Math.random() * middleNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${middle} ${last}`;
  }

  function generateRandomBirthYear() {
    // Generate birth year between 1940 and 2005 (ages 18-83)
    return 1940 + Math.floor(Math.random() * (2005 - 1940 + 1));
  }

  function generateRandomPhone() {
    // Vietnamese phone number format: 09x xxx xxx or 08x xxx xxx
    const prefixes = [
      "090",
      "091",
      "092",
      "093",
      "094",
      "095",
      "096",
      "097",
      "098",
      "086",
      "088",
      "089",
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000)
      .toString()
      .padStart(7, "0");
    return `${prefix} ${suffix.substring(0, 3)} ${suffix.substring(3)}`;
  }

  function generateRandomAddress() {
    const street = streets[Math.floor(Math.random() * streets.length)];
    const streetName =
      streetNames[Math.floor(Math.random() * streetNames.length)];
    const ward = wards[Math.floor(Math.random() * wards.length)];
    const wardName = wardNames[Math.floor(Math.random() * wardNames.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const districtName =
      districtNames[Math.floor(Math.random() * districtNames.length)];
    const number = Math.floor(Math.random() * 200) + 1;
    return `${number} ${street} ${streetName}, ${ward} ${wardName}, ${district} ${districtName}`;
  }

  for (let i = 0; i < 100; i++) {
    // Wait for 100ms before each addition (except first)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const name = generateRandomName();
    const birthYear = generateRandomBirthYear();
    const gender = Math.random() > 0.5 ? "Nam" : "Nữ";
    const phone = generateRandomPhone();
    const address = generateRandomAddress();
    const consent = true; // Always consent for test data

    document.getElementById("f-name").value = name;
    document.getElementById("f-birthYear").value = birthYear;
    document.getElementById("f-gender").value = gender;
    document.getElementById("f-phone").value = phone;
    document.getElementById("f-address").value = address;
    document.getElementById("f-consent").checked = consent;

    addParticipant();
  }

  console.log("Finished adding 100 random participants!");
  toast("Đã thêm 100 khách hàng ngẫu nhiên để test", "success");
}

if (__TEST_MODE) {
  document.addEventListener("DOMContentLoaded", () => {
    if (CURRENT_ROLE === "dataentry") {
      setTimeout(() => {
        addRandomParticipantsTest();
      }, 10000);
    }
  });
}
