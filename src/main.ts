import { mount } from "svelte";
import "./app.css";
import App from "./app.svelte";
import { getFFmpeg } from "./lib/ffmpeg";

getFFmpeg(); //preload

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
