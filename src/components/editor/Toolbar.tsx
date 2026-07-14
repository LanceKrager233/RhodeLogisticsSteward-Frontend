import { Select } from "@base-ui/react/select";
import type { ReactNode } from "react";
import {
  ArrowCounterClockwiseIcon,
  BookOpenTextIcon,
  CaretDownIcon,
  DownloadSimpleIcon,
  FileArrowDownIcon,
  FileArrowUpIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { bentoLayoutIds } from "../../domain/bentoDefinitions";
import {
  normalizePosterMode,
  normalizePosterTemplateId,
  posterModeIds,
  posterModeLabels,
  posterTemplateIds,
  posterTemplateLabels,
} from "../../domain/posterDefinitions";
import { queueCountOptions } from "../../domain/queueLimits";
import type { PosterMode, PosterTemplateId, ScheduleDocument } from "../../domain/types";
import styles from "../../styles/editor.module.css";
import { ContourButton } from "../ui/ContourButton";

interface ToolbarProps {
  document: ScheduleDocument;
  onLayoutChange: (layoutId: string) => void;
  onQueueCountChange: (count: number) => void;
  onPosterTemplateChange: (templateId: PosterTemplateId) => void;
  onPosterModeChange: (mode: PosterMode) => void;
  onImportClick: () => void;
  onSklandImportClick: () => void;
  onExportJson: () => void;
  onExportMaa: () => void;
  onExportPng: () => void;
  onReset: () => void;
}

function LayoutSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const items = bentoLayoutIds.map((layoutId) => ({ label: layoutId, value: layoutId }));

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>布局</span>
      <Select.Root items={items} onValueChange={(next) => onChange(String(next))} value={value}>
        <Select.Trigger className={styles.selectTrigger}>
          <Select.Value />
          <Select.Icon className={styles.selectIcon}>
            <CaretDownIcon size={14} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            align="start"
            alignItemWithTrigger={false}
            className={styles.selectPositioner}
            collisionPadding={8}
            sideOffset={5}
          >
            <Select.Popup className={styles.selectPopup}>
              <Select.List className={styles.selectList}>
                {items.map((item) => (
                  <Select.Item className={styles.selectItem} key={item.value} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}

function NativeSelect({
  label,
  value,
  children,
  onChange,
}: {
  label: string;
  value: string;
  children: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        aria-label={label}
        className={styles.textInput}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

export function Toolbar({
  document,
  onLayoutChange,
  onQueueCountChange,
  onPosterTemplateChange,
  onPosterModeChange,
  onImportClick,
  onSklandImportClick,
  onExportJson,
  onExportMaa,
  onExportPng,
  onReset,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeading}>
        <LayoutSelect onChange={onLayoutChange} value={document.layoutId} />
        <NativeSelect
          label="队列"
          onChange={(value) => onQueueCountChange(Number(value))}
          value={String(document.queueCount)}
        >
          {queueCountOptions.map((count) => (
            <option key={count} value={count}>
              {count} 队列
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          label="导出模板"
          onChange={(value) => onPosterTemplateChange(value as PosterTemplateId)}
          value={normalizePosterTemplateId(document.posterTemplateId)}
        >
          {posterTemplateIds.map((templateId) => (
            <option key={templateId} value={templateId}>
              {posterTemplateLabels[templateId]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          label="排班模式"
          onChange={(value) => onPosterModeChange(value as PosterMode)}
          value={normalizePosterMode(document.posterMode)}
        >
          {posterModeIds.map((mode) => (
            <option key={mode} value={mode}>
              {posterModeLabels[mode]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className={styles.toolbarActions}>
        <ContourButton
          icon={<FileArrowUpIcon />}
          onClick={onImportClick}
          size="sm"
          variant="white"
        >
          导入
        </ContourButton>
        <ContourButton
          icon={<ShieldCheckIcon />}
          onClick={onSklandImportClick}
          size="sm"
          variant="white"
        >
          森空岛
        </ContourButton>
        <ContourButton
          icon={<FileArrowDownIcon />}
          onClick={onExportJson}
          size="sm"
          variant="white"
        >
          JSON
        </ContourButton>
        <ContourButton
          icon={<FileArrowDownIcon />}
          onClick={onExportMaa}
          size="sm"
          variant="white"
        >
          MAA
        </ContourButton>
        <ContourButton
          icon={<BookOpenTextIcon />}
          onClick={() => window.open("https://github.com/KnightCodeSquareMatrix/arknights-base-vault", "_blank", "noopener,noreferrer")}
          size="sm"
          variant="white"
        >
          知识库
        </ContourButton>
        <ContourButton
          icon={<ArrowCounterClockwiseIcon />}
          onClick={onReset}
          size="sm"
          variant="red"
        >
          重置
        </ContourButton>
        <ContourButton
          icon={<DownloadSimpleIcon />}
          onClick={onExportPng}
          size="sm"
          variant="yellow"
        >
          导出图片
        </ContourButton>
      </div>
    </div>
  );
}
