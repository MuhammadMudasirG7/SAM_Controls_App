import dbConnect from '../../../lib/db';
import Employee from '../../../models/Employee';

export async function GET(request) {
  try {
    await dbConnect();

    await Employee.deleteMany({ employeeId: "EMP-10482" });

    const adminPreRegisteredUser = new Employee({
      employeeId: "EMP-10482",
      name: "Muhammad Ali",
      email: "f.ali@najd-infra.sa",
      password: null,
      failedAttempts: 0,
      isLockedOut: false
    });

    await adminPreRegisteredUser.save();

    return Response.json({
      success: true,
      message: "Owner Hardcoded ID Configuration Activated on MongoDB Cloud Atlas! EMP-10482 is waiting for password enrollment."
    });
  } catch (error) {
    return Response.json({ error: "Cloud Seeding database transaction failure exception" }, { status: 500 });
  }
}
