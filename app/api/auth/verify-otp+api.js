export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId, code } = body;

    const correctCode = "123456";

    if (code === correctCode) {
      return Response.json({ 
        success: true, 
        message: "OTP validation cleared securely" 
      });
    }

    return Response.json({ error: "The token you entered is invalid" }, { status: 401 });

  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
