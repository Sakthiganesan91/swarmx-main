const sender = "support@swarmx.ai";

const otpEmail = (email, username, otp) => {
  return {
    to: email,
    from: sender,
    subject: "OTP Verification",
    html: ` <div
            style="
            border-radius: 10px;
            
            padding: 16px;
            font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
            background-image: linear-gradient(
                to right bottom,
                rgb(1, 175, 255),
                white,
                rgba(2, 133, 255, 0.788)
            );
            "
        >
            <h1 style="text-align: center; color: rgba(2, 133, 255, 0.788)">
            Exit
            </h1>
            <p style="font-style: italic">
            Hey ${username} , Thank you for signing up to Swarmx
            </p>
            <hr style="color: white" />
            <p>OTP for verification ${otp}</p>
            <p>Otp will be valid for 2 minutes</p>
            
        </div>`,
  };
};

const otpEmailResetPassword = (email, otp) => {
  return {
    to: email,
    from: sender,
    subject: "Reset Password OTP",
    html: ` <div
            style="
            border-radius: 10px;
            
            padding: 16px;
            font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
            background-image: linear-gradient(
                to right bottom,
                rgb(1, 175, 255),
                white,
                rgba(2, 133, 255, 0.788)
            );
            "
        >
            <h1 style="text-align: center; color: rgba(2, 133, 255, 0.788)">
            Reset Password
            </h1>
            <p style="font-style: italic">
            Hey user , Below is the OTP for reseting password</p>
            <hr style="color: white" />
            <p>OTP for reseting your password ${otp}</p>
            <p>Otp will be valid for 2 minutes</p>
            
        </div>`,
  };
};
const sheduleInterview = (
  candidateEmail,
  candidateName,
  jobId,
  candidateId,
  password,
  companyUsername,
  companyName
) => {
  return {
    to: candidateEmail,
    from: sender,
    subject: "Scheduled Interview",
    html: ` <div
                    style="
                    border-radius: 10px;
                    
                    padding: 16px;
                    font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
                    background-image: linear-gradient(
                        to right bottom,
                        rgb(1, 175, 255),
                        white,
                        rgba(2, 133, 255, 0.788)
                    );
                    "
                  >
                    <h1 style="text-align: center; color: rgba(2, 133, 255, 0.788)">
                    SwarmX Interview
                    </h1>
                    <p style="font-style: italic">
                    Hey ${candidateName} , Please find the link to interview below.
                    Attend this within 2 days before the link expires
                    </p>
                    <hr style="color: white" />
                   ${process.env.INTERVIEW_URL}/?jobId=${jobId}&candidateId=${candidateId}
                   <p>Use this password to attend the interview: ${password}</p>
                    <p>All the best</p>
                    <p>Best Regards, </p>
            <p>${companyUsername}, </p>
            <p>${companyName}.</p>
                </div>`,
  };
};

const scheduleCoding = (
  candidateEmail,
  candidateName,
  jobId,
  candidateId,
  password,
  companyUsername,
  companyName
) => {
  return {
    to: candidateEmail,
    from: sender,
    subject: "Scheduled Coding Interview",
    html: ` <div
                    style="
                    border-radius: 10px;
                    
                    padding: 16px;
                    font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
                    background-image: linear-gradient(
                        to right bottom,
                        rgb(1, 175, 255),
                        white,
                        rgba(2, 133, 255, 0.788)
                    );
                    "
                  >
                    <h1 style="text-align: center; color: rgba(2, 133, 255, 0.788)">
                    SwarmX Interview - Coding round
                    </h1>
                    <p style="font-style: italic">
                    Hey ${candidateName} , Please find the link below.
                    Attend this within 2 days before the link expires
                    </p>
                    <hr style="color: white" />
                   ${process.env.CODING_URL}/?jobId=${jobId}&candidateId=${candidateId}
                   <p>Use this password to attend the coding interview: ${password}</p>
                    <p>All the best</p>
                    <p>Best Regards, </p>
            <p>${companyUsername}, </p>
            <p>${companyName}.</p>
                </div>`,
  };
};

const sendSlotScheduleMailToCandidate = (email, candidateId) => {
  return {
    to: email,
    from: sender,
    subject: "Interview Schedule",
    html: ` <div
        style="
        border-radius: 10px;
       
        padding: 16px;
        font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
        background-image: linear-gradient(
            to right bottom,
            rgb(1, 175, 255),
            white,
            rgba(2, 133, 255, 0.788)
        );
        "
    >
       
        <p style="font-style: italic">
         schedule your Interview.
        </p>
        <hr style="color: white" />
       
        <a href=${process.env.APPLICATION_URL}/chat?candidateId=${candidateId}>Link</a>
 
       
    </div>`,
  };
};

const sendConfirmSlotScheduleMailToInterviewer = (
  email,
  start,
  end,
  meetingLink,
  candidateId,
  password
) => {
  return {
    to: email,
    from: sender,
    subject: "Interview Schedule",
    html: ` <div
            style="
            border-radius: 10px;
           
            padding: 16px;
            font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
            background-image: linear-gradient(
                to right bottom,
                rgb(1, 175, 255),
                white,
                rgba(2, 133, 255, 0.788)
            );
            "
        >
           
            <p style="font-style: italic">
             Interview has been scheduled !!
            </p>
            <p>
            Timing : ${start} to ${end}
            </p>
            <p>Meeting Link: ${meetingLink}</p>
            <p>
            To Reschedule or Decline, Check the link below.
            <a href="${process.env.APPLICATION_URL}/interviewer-confirmation?candidateId=${encodeURIComponent(
      candidateId
    )}&email=${encodeURIComponent(email)}">Link</a>
            </p>
            <p>Use this password to enter: ${password}</p>
            <hr style="color: white" />
           <p>THANK YOU!!</p>
           
        </div>`,
  };
};

const sendNotifyDeclinedMail = (email, candidateId) => {
  return {
    to: email,
    from: sender,
    subject: "Interview Declined",
    html: ` <div
        style="
        border-radius: 10px;
       
        padding: 16px;
        font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
        background-image: linear-gradient(
            to right bottom,
            rgb(1, 175, 255),
            white,
            rgba(2, 133, 255, 0.788)
        );
        "
    >
       
        <p style="font-style: italic">
         Sorry, Your has been declined!!
         Choose other prefered timing in below link
        </p>
        <hr style="color: white" />
       
        <a href=${process.env.APPLICATION_URL}/chat?candidateId=${candidateId}>Link</a>
 
       
    </div>`,
  };
};

const rescheduleEmailByCandidate = (
  email,
  start,
  end,
  meetingLink,
  candidateId
) => {
  return {
    to: email,
    from: sender,
    subject: "Interview Re-Schedule",
    html: ` <div
            style="
            border-radius: 10px;
           
            padding: 16px;
            font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
            background-image: linear-gradient(
                to right bottom,
                rgb(1, 175, 255),
                white,
                rgba(2, 133, 255, 0.788)
            );
            "
        >
           
            <p style="font-style: italic">
             Interview has been Rescheduled !!
            </p>
            <p>
            Timing : ${start} to ${end}
            </p>
            <p>Meeting Link: ${meetingLink}</p>
           <p style="font-style: italic">
             To Re-schedule your Interview.
            </p>
            <hr style="color: white" />
           
            <a href=${process.env.APPLICATION_URL}/chat?candidateId=${candidateId}>Link</a>
     
            <hr style="color: white" />
           <p>THANK YOU!!</p>
           
        </div>`,
  };
};

module.exports = {
  otpEmail,
  sheduleInterview,
  scheduleCoding,
  sendSlotScheduleMailToCandidate,
  sendConfirmSlotScheduleMailToInterviewer,
  sendNotifyDeclinedMail,
  rescheduleEmailByCandidate,
  otpEmailResetPassword,
};
