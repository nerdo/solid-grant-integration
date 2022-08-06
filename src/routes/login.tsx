import { useNavigate } from "solid-start";
import server from "solid-start/server";

const authHandler = server(async (...args) => {
  console.debug(`Running on the server at ${authHandler.url}`);
  console.debug('args', args)
});

export default function Login() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(authHandler.url)}>
        Log In with Microsoft
      </button>
      <div>{authHandler.url}</div>
    </div>
  );
}
