import { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/UserStore"; 
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface MatchedJob {
  jobId: string;
  title: string;
  requiredSkills: string[];
  matchedSkills: string[];
  matchPercentage: number;
  location: string;
  pay: string;
  type: string;
  description: string;
}

const MatchedJobs = () => {
  const userId = useUserStore((state) => state.id); 
  const userEmail = useUserStore((state) => state.email); 
  const userName = useUserStore((state) => state.name); 
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]); 
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatchedJobs = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/users/matched-jobs/${userId}`
        );
        if (response.status === 200) {
          const filteredJobs = response.data.matchedJobs.filter(
            (job: MatchedJob) => job.matchPercentage > 50
          );
          setMatchedJobs(filteredJobs);
        } else {
          toast.error("Error fetching matched jobs.");
        }
      } catch (error) {
        toast.error("Error fetching matched jobs.");
      }
    };

    if (userId) {
      fetchMatchedJobs();
    }
  }, [userId]);

  // Handle applying for a job
  const handleApply = async (job: MatchedJob) => {
    setLoading(true); 
    try {
      const applicationData = {
        jobname: job.title,
        applicantname: userName,
        applicantid: userId,
        applicantemail: userEmail,
        applicantSkills: job.matchedSkills.join(", "),
        phonenumber: "",
        managerid: "",
        jobid: job.jobId,
      };

      const response = await axios.post(
        "http://localhost:8000/api/v1/users/applyJob",
        applicationData
      );

      if (response.status === 200) {
        toast.success("You have successfully applied for the job!");
        setAppliedJobs([...appliedJobs, job.jobId]); 
      } else {
        toast.error(response.data.message || "Error applying for the job.");
      }
    } catch (error) {
      toast.error("Failed to apply for the job. Please try again.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">Matched Jobs</h1>
      {matchedJobs.length === 0 ? (
        <p className="text-center text-gray-600">No matched jobs found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matchedJobs.map((job) => (
            <div
              key={job.jobId}
              className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600"><strong>Location:</strong> {job.location}</p>
                <p className="text-sm text-gray-600"><strong>Job Type:</strong> {job.type}</p>
                <p className="text-sm text-gray-600"><strong>Pay:</strong> {job.pay}/hr</p>
                <p className="text-sm text-gray-600"><strong>Required Skills:</strong> {job.requiredSkills.join(", ")}</p>
                <p className="text-sm text-gray-600"><strong>Matched Skills:</strong> {job.matchedSkills.join(", ")}</p>
                <p className="text-sm text-gray-500"><strong>Match Percentage:</strong> {job.matchPercentage}%</p>
                <p className="text-sm text-gray-700"><strong>Description:</strong> {job.description}</p>
              </div>

              {/* Apply Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => handleApply(job)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                  disabled={appliedJobs.includes(job.jobId) || loading} // Disable button if already applied or if loading
                >
                  {loading ? "Applying..." : appliedJobs.includes(job.jobId) ? "Already Applied" : "Apply Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchedJobs;
