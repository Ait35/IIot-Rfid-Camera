// universityApi.mock.ts

// 1. กำหนด Interface สำหรับข้อมูลที่คาดว่าจะได้รับจาก API มหาวิทยาลัย
export interface UniversityProfile {
    university_id: string;
    first_name: string;
    last_name: string;
    faculty: string;
    department: string;
    role: 'student' | 'teacher' | 'staff';
    status: 'active' | 'graduated' | 'suspended'; // สถานะปัจจุบัน
}

export interface ApiResponse {
    success: boolean;
    message: string;
    data: UniversityProfile | null;
}

// 2. จำลองฐานข้อมูลส่วนกลางของมหาวิทยาลัย (Mock Data)
const mockUniversityDB: UniversityProfile[] = [
    {
        university_id: '67000123',
        first_name: 'สมชาย',
        last_name: 'รักเรียน',
        faculty: 'วิศวกรรมศาสตร์',
        department: 'วิศวกรรมคอมพิวเตอร์',
        role: 'student',
        status: 'active'
    },
    {
        university_id: '64000999',
        first_name: 'สมหญิง',
        last_name: 'จบแล้ว',
        faculty: 'วิศวกรรมศาสตร์',
        department: 'วิศวกรรมคอมพิวเตอร์',
        role: 'student',
        status: 'graduated' // เคสพ้นสภาพ/เรียนจบ
    },
    {
        university_id: 'T0001',
        first_name: 'อจ.สมศักดิ์',
        last_name: 'ระบบดี',
        faculty: 'วิศวกรรมศาสตร์',
        department: 'วิศวกรรมคอมพิวเตอร์',
        role: 'teacher',
        status: 'active' // เคสอาจารย์
    },{
        university_id: '67159200',
        first_name: 'อธิป',
        last_name: 'ปทุมสูติ',
        faculty: 'วิศวกรรมศาสตร์',
        department: 'วิศวกรรมคอมพิวเตอร์',
        role: 'student',
        status: 'active',
        // status: 'graduated',
    },{
        university_id: '67199999',
        first_name: 'Gemini',
        last_name: 'Flash3.8',
        faculty: 'ตัวแบกโปรเจ็ค',
        department: 'ตัวแบกโปรเจ็ค',
        role: 'teacher',
        status: 'active',
    }
];

// 3. ฟังก์ชันหลักสำหรับดึงข้อมูล (จำลองการยิง HTTP Request)
export const fetch_data = async (universityId: string): Promise<ApiResponse> => {
    // จำลอง Network Delay ประมาณ 0.5 - 1 วินาที
    await new Promise(resolve => setTimeout(resolve, 800));

    // ค้นหาข้อมูลใน Mock DB
    const userProfile = mockUniversityDB.find(u => u.university_id === universityId);

    if (!userProfile) {
        return {
            success: false,
            message: 'ไม่พบข้อมูลรหัสประจำตัวนี้ในระบบส่วนกลาง',
            data: null
        };
    }

    return {
        success: true,
        message: 'ดึงข้อมูลสำเร็จ',
        data: userProfile
    };
};