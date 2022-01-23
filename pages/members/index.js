import { Grid } from "@mui/material";
import { useState } from "react";
import { QueryClient, useMutation, useQuery } from "react-query";
import CustomerDrawer from "../../src/components/custom-drawers";
import ModuleToolbar from "../../src/components/module-toolbar";
import Layout from "../../src/layouts";
import { searchUser, updateUsersStatus } from "../../src/microservices/users";
import { getSession } from "next-auth/react";
import ProfileCard from "../../src/components/profile-card";
import { useDebounce } from "use-debounce";

const Members = ({ session }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uid, setUid] = useState("");
  const [searchText, setSearchText] = useState("");
  const [value] = useDebounce(searchText, 1000);
  const [searchFilters, setSearchFilters] = useState({
    filters: {
      search: value,
    },
    limit: 100,
  });

  const { data, isLoading, refetch } = useQuery("users:search", () =>
    searchUser(searchFilters)
  );

  const { mutate: purgeUnpurge } = useMutation(async ({ uid, status }) => {
    await updateUsersStatus(status, { uids: [uid] });
    refetch();
  });

  return (
    <>
      <Layout pageTitle="Members" session={session} isLoading={isLoading}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ModuleToolbar
              onAdd={() => {
                setIsEditMode(false);
                setIsDrawerOpen(true);
              }}
              onSearch={(e) => setSearchText(e.target.value)}
            />
          </Grid>
          {!isLoading &&
            data?.data.map((_member) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={_member.uid}>
                <ProfileCard
                  data={_member}
                  onPurge={() =>
                    purgeUnpurge({
                      uid: _member.uid,
                      status: !_member.isActive,
                    })
                  }
                />
              </Grid>
            ))}
        </Grid>
      </Layout>
      <CustomerDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setUid("");
        }}
        isEditMode={isEditMode}
        uid={uid}
      />
    </>
  );
};

export default Members;

export const getServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  await queryClient.prefetchQuery("users:search", () =>
    searchUser(session.user.accessToken)
  );

  return {
    props: {
      session,
    },
  };
};
