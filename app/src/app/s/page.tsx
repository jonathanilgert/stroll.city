import { redirect } from "next/navigation";

export default function StickerRedirect() {
  redirect("/calgary?hood=inglewood&utm_source=sticker&utm_campaign=inglewood-window");
}
