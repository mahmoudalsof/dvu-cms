import { Box, FormHelperText, Grid, Input, Typography } from "@mui/material";
import CustomTextField from "../custom-text-field";
import CustomButton from "../custom-button";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import {
  createAnnouncement,
  getAnnouncementByUid,
  updateAnnouncementByUid,
} from "../../microservices/announcements";
import { useSession } from "next-auth/react";
const ReactQuill =
  typeof window === "object" ? require("react-quill") : () => false;

const AnnouncementDrawer = ({ uid, onClose, isEditMode }) => {
  const queryClient = useQueryClient();
  const session = useSession();
  const [imagePreview, setImagePreview] = useState(null);

  const { data, isLoading, isFetching } = useQuery(
    `announcements:${uid}`,
    async () => await getAnnouncementByUid(session.data.user.accessToken, uid),
    { enabled: Boolean(isEditMode) !== false }
  );

  const [initialValues, setInitialValues] = useState({
    title: "",
    details: "",
    poster: "",
    isPublished: false,
  });

  useEffect(() => {
    if (!isLoading && isEditMode && !isFetching)
      setInitialValues({ ...data.data, poster: data.data.poster?.uid });
  }, [data]);

  const validationSchema = yup.object().shape({
    title: yup.string().required("Required"),
    details: yup.string().required("Required"),
    poster: yup.mixed().test("isPosterChanged", "err", (value) => {
      if (typeof value === "string") return true;
      else if (typeof value === "object") return true;
      else if (value === "" || value === undefined) return true;
      else return false;
    }),
    isPublished: yup.bool().optional(),
  });

  const { mutate: editAnnouncement } = useMutation(
    async (values) =>
      await updateAnnouncementByUid(session.data.user.accessToken, uid, values),
    {
      onSuccess: () => queryClient.invalidateQueries("announcements:search"),
    }
  );

  const { mutate: addAnnouncement } = useMutation(
    async (values) =>
      await createAnnouncement(session.data.user.accessToken, values),
    {
      onSuccess: () => queryClient.invalidateQueries("announcements:search"),
    }
  );

  const { values, handleChange, handleSubmit, errors, touched, setFieldValue } =
    useFormik({
      validationSchema,
      initialValues,
      enableReinitialize: true,
      onSubmit: async (values) => {
        isEditMode ? editAnnouncement(values) : addAnnouncement(values);
        onClose();
      },
    });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">
          {isEditMode ? "Edit" : "Add"} Announcement
        </Typography>
      </Grid>
      {!isLoading && (
        <>
          <Grid item xs={12}>
            <CustomTextField
              label="Title"
              name="title"
              value={values.title || ""}
              onChange={handleChange}
              error={touched.title && Boolean(errors.title)}
              helperText={touched.title && errors.title}
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

export default AnnouncementDrawer;
