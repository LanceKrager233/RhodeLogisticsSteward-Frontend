import { Dialog } from "@base-ui/react/dialog";
import { ArrowSquareOutIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import styles from "../../styles/editor.module.css";
import { ContourButton } from "../ui/ContourButton";

const COPY_COMMAND =
  "copy(localStorage.getItem('SK_OAUTH_CRED_KEY')+','+localStorage.getItem('SK_TOKEN_CACHE_KEY'))";

interface SklandImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (credentials: string) => Promise<void>;
}

export function SklandImportDialog({ open, onOpenChange, onImport }: SklandImportDialogProps) {
  const [credentials, setCredentials] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [copied, setCopied] = useState(false);

  function changeOpen(next: boolean) {
    if (loading) return;
    onOpenChange(next);
    if (!next) {
      setCredentials("");
      setLocalError("");
      setCopied(false);
    }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(COPY_COMMAND);
      setCopied(true);
      setLocalError("");
    } catch {
      setLocalError("复制失败，请手动复制下方命令。");
    }
  }

  async function submit() {
    if (!credentials.trim()) return;
    setLoading(true);
    setLocalError("");
    try {
      await onImport(credentials);
      onOpenChange(false);
      setCredentials("");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "森空岛练度读取失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.dialogBackdrop} />
        <Dialog.Popup className={[styles.dialogPopup, styles.sklandDialog].join(" ")}>
          <Dialog.Title className={styles.dialogTitle}>从森空岛导入练度</Dialog.Title>
          <Dialog.Description className={styles.sklandDescription}>
            凭据仅在当前页面直连森空岛时使用，不会保存到本地，也不会发给本项目服务器。
          </Dialog.Description>
          <div className={styles.sklandDialogBody}>
            <div className={styles.canvasToolbarActions}>
              <ContourButton
                icon={<ArrowSquareOutIcon />}
                onClick={() => window.open("https://www.skland.com/index", "_blank", "noopener,noreferrer")}
                size="sm"
                variant="white"
              >
                打开森空岛
              </ContourButton>
              <ContourButton icon={<CopyIcon />} onClick={() => void copyCommand()} size="sm" variant="white">
                {copied ? "已复制" : "复制获取命令"}
              </ContourButton>
            </div>
            <ol className={styles.sklandSteps}>
              <li>登录森空岛网页版，打开开发者工具的控制台。</li>
              <li>运行下面的命令，将复制结果粘贴到“森空岛凭据”。</li>
              <li>导入完成后建议清空剪贴板，不要把凭据发给其他人。</li>
            </ol>
            <code className={styles.sklandCommand}>{COPY_COMMAND}</code>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>森空岛凭据</span>
              <input
                autoComplete="off"
                className={styles.textInput}
                disabled={loading}
                onChange={(event) => setCredentials(event.target.value)}
                placeholder="cred,token"
                type="password"
                value={credentials}
              />
            </label>
            {localError ? <div className={styles.error}>{localError}</div> : null}
          </div>
          <div className={styles.dialogActions}>
            <ContourButton disabled={loading} onClick={() => changeOpen(false)} size="sm" variant="white">
              取消
            </ContourButton>
            <ContourButton
              disabled={loading || !credentials.trim()}
              onClick={() => void submit()}
              size="sm"
              variant="yellow"
            >
              {loading ? "正在读取" : "获取练度"}
            </ContourButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
