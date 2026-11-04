export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId } = body;

    const mockEmpId = "EMP-10482";

    if (employeeId === mockEmpId) {
      return Response.json({ 
        success: true, 
        message: "Verification code sent to registered corporate profile email." 
      });
    }

    return Response.json({ error: "Employee ID not found on system" }, { status: 404 });

  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
