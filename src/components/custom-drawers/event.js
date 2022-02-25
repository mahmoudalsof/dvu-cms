import {
  Box,
  FormControlLabel,
  FormHelperText,
  Grid,
  Input,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CustomTextField from "../custom-text-field";
import moment from "moment";
import { DatePicker, TimePicker } from "@mui/lab";
import CustomButton from "../custom-button";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  getEventByUid,
  updateEventByUid,
  createEvent,
} from "../../microservices/events";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { useSession } from "next-auth/react";
const ReactQuill =
  typeof window === "object" ? require("react-quill") : () => false;

const EventDrawer = ({ uid, onClose, isEditMode }) => {
  const queryClient = useQueryClient();
  const session = useSession();
  const [imagePreview, setImagePreview] = useState(null);
  const { data, isLoading, isFetching } = useQuery(
    `events:${uid}`,
    async () => await getEventByUid(session.data.user.accessToken, uid),
    { enabled: Boolean(isEditMode) !== false }
  );

  const [initialValues, setInitialValues] = useState({
    name: "",
    date: moment(),
    meetingName: "",
    meetingTime: moment(),
    meetingLocation: "",
    details: "",
    isMajor: false,
    poster: "",
    isOpen: false,
  });

  useEffect(() => {
    if (!isLoading && isEditMode && !isFetching)
      setInitialValues({ ...data.data, poster: data.data.poster?.uid });
  }, [data]);

  const validationSchema = yup.object().shape({
    name: yup.string().required("Required"),
    date: yup.string().required("Required"),
    meetingName: yup.string().required("Required"),
    meetingTime: yup.string().required("Required"),
    meetingLocation: yup.string().required("Required"),
    details: yup.string().required("Required"),
    isMajor: yup.boolean().optional(),
    isOpen: yup.boolean().optional(),
    poster: yup.mixed().test("isPosterChanged", "err", (value) => {
      if (typeof value === "string") return true;
      else if (typeof value === "object") return true;
      else if (value === "" || value === undefined) return true;
      else return false;
    }),
  });

  const { mutate: editEvent } = useMutation(
    async (values) =>
      await updateEventByUid(session.data.user.accessToken, uid, values),
    {
      onSuccess: () => queryClient.invalidateQueries("events:search"),
    }
  );

  const { mutate: addEvent } = useMutation(
    async (values) => await createEvent(session.data.user.accessToken, values),
    {
      onSuccess: () => queryClient.invalidateQueries("events:search"),
    }
  );

  const { values, handleChange, handleSubmit, errors, touched, setFieldValue } =
    useFormik({
      validationSchema,
      initialValues,
      enableReinitialize: true,
      onSubmit: async (values) => {
        isEditMode ? editEvent(values) : addEvent(values);
        onClose();
      },
    });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">
          {isEditMode ? "Edit" : "Add"} Event
        </Typography>
      </Grid>
      {!isLoading && (
        <>
          <Grid item xs={12}>
            <CustomTextField
              label="Name"
              name="name"
              value={values.name || ""}
              onChange={handleChange}
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <ReactQuill
              theme="snow"
              value={values.details}
              onChange={(nv) => setFieldValue("details", nv)}></ReactQuill>
            <FormHelperText error>
              {touched.details && errors.details}
            </FormHelperText>
          </Grid>
          <Grid item xs={12}>
            <DatePicker
              label="Date"
              inputFormat="DD/MM/YYYY"
              value={values.date}
              renderInput={(params) => <CustomTextField params={params} />}
              onChange={(date) => setFieldValue("date", date.format())}
            />
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Event Type
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <ToggleButtonGroup
                  value={values.isMajor}
                  exclusive
                  onChange={(e) => setFieldValue("isMajor", e.target.value)}>
                  <ToggleButton value={true}>Major</ToggleButton>
                  <ToggleButton value={false}>Minor</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Grid>
          {imagePreview && (
            <Grid item xs={12}>
              <img
                width={"100%"}
                height={500}
                src={imagePreview}
                style={{ objectFit: "contain" }}
              />
            </Grid>
          )}

          <Grid item xs={12} textAlign="center">
            <label htmlFor="contained-button-file">
              <Input
                sx={{ display: "none" }}
                inputProps={{
                  accept: "image/*",
                }}
                id="contained-button-file"
                type="file"
                onChange={(e) => {
                  setFieldValue("poster", e.target.files[0]);
                  setImagePreview(URL.createObjectURL(e.target.files[0]));
                }}
              />
              <CustomButton
                label={values.poster ? "Change Poster" : "Upload Poster"}
                component="span"
              />
            </label>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">Meeting point Details</Typography>
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  label="Meeting Name"
                  name="meetingName"
                  value={values.meetingName || ""}
                  onChange={handleChange}
                  error={touched.meetingName && Boolean(errors.meetingName)}
                  helperText={touched.meetingName && errors.meetingName}
                />
              </Grid>
              <Grid item xs={12}>
                <TimePicker
                  value={values.meetingTime}
                  label="Meeting Time"
                  renderInput={(params) => <CustomTextField params={params} />}
                  onChange={(time) =>
                    setFieldValue("meetingTime", time.format())
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  label="Meeting Location"
                  name="meetingLocation"
                  value={values.meetingLocation || ""}
                  onChange={handleChange}
                  error={
                    touched.meetingLocation && Boolean(errors.meetingLocation)
                  }
                  helperText={touched.meetingLocation && errors.meetingLocation}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  color="success"
                  checked={values.isOpen}
                  onChange={(e, checked) => setFieldValue("isOpen", checked)}
                />
              }
              label={
                values.isOpen ? "Registration Open" : "Registration Closed"
              }
              name="isOpen"
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex">
              <CustomButton
                label="Cancel"
                variant="text"
                color="inherit"
                onClick={onClose}
              />
              <CustomButton label="Save" onClick={handleSubmit} />
            </Box>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default EventDrawer;
