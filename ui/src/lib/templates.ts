import type { TemplateId } from './types';

const normalizePackageId = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Treat placeholder text (e.g. "<replace-with-dar-package-id>") as unset
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return undefined;
  return trimmed;
};

const packageId = normalizePackageId(import.meta.env.VITE_DAML_PACKAGE_ID);

const buildTemplate = (moduleName: string, entityName: string): TemplateId => {
  if (packageId && packageId.length > 0) {
    return { packageId, moduleName, entityName };
  }
  return { moduleName, entityName };
};

export const Templates = {
  ReceivableAsset: buildTemplate('Arche', 'ReceivableAsset'),
  ConfirmedReceivable: buildTemplate('Arche', 'ConfirmedReceivable'),
  FinancingAgreement: buildTemplate('Arche', 'FinancingAgreement'),
  SettlementRecord: buildTemplate('Arche', 'SettlementRecord'),
  PledgeRegistry: buildTemplate('Arche.Pledge', 'PledgeRegistry'),
  PledgeReleaseRequest: buildTemplate('Arche', 'PledgeReleaseRequest')
} as const;


