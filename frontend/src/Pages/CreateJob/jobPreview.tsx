import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/UserStore";
import { Button, Stack } from "@mui/material";
import { AiFillCheckCircle } from "react-icons/ai";
import { useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

type FormValuesQuestions = {
  // question1: string;
  // question2: string;
  // question3: string;
  // question4: string;
  questions: string[];
};

type FormValuesDetails = {
  role: string;
  jobtype: string;
  location: string;
  pay: string;
  description: string;
  requiredSkills: string;
};

const JobPreview = () => {
  const location = useLocation();
  const { state } = location;
  const {
    details,
    questions,
  }: { details: FormValuesDetails; questions: FormValuesQuestions;} = state;

  const navigate = useNavigate();
  const userId = useUserStore((state) => state.id);

  const onSubmit = (e: any) => {
    e.preventDefault();

    const url = "http://localhost:8000/api/v1/users/createjob";
    const body = {
      id: userId,
      name: details.role,
      type: details.jobtype,
      location: details.location,
      description: details.description,
      pay: details.pay,
      questions: questions.questions,
      requiredSkills: details.requiredSkills,
    };

    axios
      .post(url, body)
      .then((res) => {
        if (res.status !== 200) {
          toast.error("Job posting failed");
          return;
        }

        const notifyApplicantsUrl =
          "http://localhost:8000/api/v1/users/notifyApplicants";
        const body = {
          jobId: userId, // Assuming the job response contains the created job ID
          jobName: details.role, // Assuming 'role' is the job title
        };

        // Notify all applicants
        axios
          .post(notifyApplicantsUrl, body)
          .then((notificationRes) => {
            console.log(notificationRes);
            if (notificationRes.status === 200) {
              toast.success("Job created and applicants notified");
            } else if (notificationRes.status === 404) {
              //toast.error(notificationRes.json.message);
            } else {
              toast.error("Error notifying applicants");
            }
          })
          .catch((error) => {
            toast.error("An error occurred while notifying applicants");
            console.error("Error notifying applicants:", error);
          });

        // Success after both steps
        toast.success("Job created");
        console.log(details);
        navigate("/dashboard");
      })
      .catch((error) => {
        toast.error("An error occurred while creating the job");
        console.error("Error:", error);
      });
  };

  useEffect(() => {
    console.log(questions);
    console.log(state);
  }, []);


  return (
    <div
      className="flex flex-col items-center min-h-screen py-10"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.6)" }}
    >
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl flex">
        <div className="w-1/3 pr-8 border-r">
          <h2 className="text-2xl font-semibold mb-6">Create New Job Listing</h2>
          <div className="flex flex-col space-y-4">
            <StepIndicator label="Add Details" completed />
            <StepIndicator label="Fill Questionnaire" completed />
            <StepIndicator label="Preview" active />
            <StepIndicator label="Confirm" />
          </div>
        </div>

        <div className="w-2/3 pl-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Job Details</h2>
          <div className="space-y-2 text-gray-700">
            <div>
              <span className="font-semibold">Role:</span> {details?.role}
            </div>
            <div>
              <span className="font-semibold">Job Status:</span>{" "}
              <span className="capitalize text-green-500">open</span>
            </div>
            <div>
              <span className="font-semibold">Type:</span> {details?.jobtype?.replace("-", " ")}
            </div>
            <div>
              <span className="font-semibold">Location:</span> {details?.location}
            </div>
            <div>
              <span className="font-semibold">Pay:</span> {details?.pay}$/hr
            </div>
          </div>

          <div className="text-lg border-b border-gray-300 mb-2 font-bold">Questions</div>
          {questions.questions.filter(question => question).length > 0 ? (  // Filter out empty strings
            questions.questions.filter(question => question).map((question, index) => (  // Map over the filtered array
              <div key={index} className="text-[#686868] mx-2">
                {index + 1}: {question}
              </div>
            ))
          ) : (
            <div className="text-[#686868] mx-2">No questions available.</div>
          )}

          <div className="mt-4">
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                style={{
                  color: "#FF5353",
                  borderColor: "#FF5353",
                  textTransform: "none",
                  fontSize: "16px",
                  minWidth: "100px",
                }}
              >
                Back
              </Button>
              <Button
                onClick={onSubmit}
                type="submit"
                variant="contained"
                style={{
                  background: "#FF5353",
                  color: "#FFF",
                  textTransform: "none",
                  fontSize: "16px",
                  minWidth: "200px",
                }}
              >
                Add Listing
              </Button>
            </Stack>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({
  label,
  active = false,
  completed = false,
}: {
  label: string;
  active?: boolean;
  completed?: boolean;
}) => (
  <div
    className={`flex items-center space-x-2 ${active ? "text-gray-800" : completed ? "text-green-600" : "text-gray-400"
      }`}
  >
    <AiFillCheckCircle
      size="20px"
      color={active ? "#1E1E1E" : completed ? "#008000" : "#CBCBCB"}
    />
    <span className={`text-lg ${active ? "font-semibold" : ""}`}>{label}</span>
  </div>
);

export default JobPreview;
