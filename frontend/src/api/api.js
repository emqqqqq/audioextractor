import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const uploadRecording = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/recordings", formData);
};

export const getRecordings = () => api.get("/recordings");