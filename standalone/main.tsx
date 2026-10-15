import { createRoot } from "react-dom/client";
import ReceiptWorkspace from "../app/receipt-workspace.tsx";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(<ReceiptWorkspace />);
