import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { customAlphabet } from 'nanoid';

const app = express();
const nanoid = customAlphabet('1234567890abcdef', 16);
app.use(cors());
app.use(bodyParser.json());

const store = {
  receivables: [],
  confirmed: [],
  financings: [],
  settlements: []
};

const wrapQuery = items => ({
  status: 200,
  result: items.map(item => ({
    contractId: item.id,
    payload: item.payload
  }))
});

const ok = () => ({
  status: 200,
  result: { exerciseResult: { ok: true } }
});

const normalizeTemplateId = template => {
  if (!template) return null;
  if (typeof template === 'string') {
    const parts = template
      .split(':')
      .map(part => part.trim())
      .filter(Boolean);
    if (parts.length === 3) {
      return {
        packageId: parts[0],
        moduleName: parts[1],
        entityName: parts[2]
      };
    }
    if (parts.length === 2) {
      return {
        moduleName: parts[0],
        entityName: parts[1]
      };
    }
    return null;
  }
  const moduleName = template.moduleName?.trim();
  const entityName = template.entityName?.trim();
  if (!moduleName || !entityName) return null;
  const normalized = { moduleName, entityName };
  const pkg = template.packageId?.trim();
  if (pkg) {
    normalized.packageId = pkg;
  }
  return normalized;
};

const invalidTemplateResponse = res =>
  res.status(400).json({ errors: ['Invalid template identifier'] });

app.post('/v1/query', (req, res) => {
  const templateId = normalizeTemplateId(req.body?.templateIds?.[0]);
  if (!templateId) {
    return invalidTemplateResponse(res);
  }
  switch (templateId.entityName) {
    case 'ReceivableAsset':
      return res.json(wrapQuery(store.receivables));
    case 'ConfirmedReceivable':
      return res.json(wrapQuery(store.confirmed));
    case 'FinancingAgreement':
      return res.json(wrapQuery(store.financings));
    case 'SettlementRecord':
      return res.json(wrapQuery(store.settlements));
    default:
      return res.json(wrapQuery([]));
  }
});

app.post('/v1/create', (req, res) => {
  const templateId = normalizeTemplateId(req.body?.templateId);
  if (!templateId) {
    return invalidTemplateResponse(res);
  }
  const { payload } = req.body;
  if (templateId.entityName !== 'ReceivableAsset') {
    return res
      .status(400)
      .json({ errors: ['Mock server only supports ReceivableAsset create'] });
  }
  const id = nanoid();
  store.receivables.push({ id, payload });
  return res.json({
    status: 200,
    result: { contractId: id, payload }
  });
});

app.post('/v1/exercise', (req, res) => {
  const templateId = normalizeTemplateId(req.body?.templateId);
  if (!templateId) {
    return invalidTemplateResponse(res);
  }
  const { contractId, choice, argument } = req.body;
  const move = (from, to, transform = payload => payload) => {
    const idx = from.findIndex(item => item.id === contractId);
    if (idx === -1) {
      return res.status(404).json({ errors: ['Contract not found in mock state'] });
    }
    const entry = from.splice(idx, 1)[0];
    to.push({ id: nanoid(), payload: transform(entry.payload) });
    return res.json(ok());
  };

  if (templateId.entityName === 'ReceivableAsset' && choice === 'Confirm') {
    return move(store.receivables, store.confirmed);
  }
  if (templateId.entityName === 'ConfirmedReceivable' && choice === 'Finance') {
    return move(store.confirmed, store.financings, payload => ({
      ...payload,
      principal: argument?.principal ?? payload.amount ?? 0,
      maturity:
        argument?.maturity ?? payload.dueDate ?? new Date().toISOString().slice(0, 10)
    }));
  }
  if (templateId.entityName === 'FinancingAgreement' && choice === 'Settle') {
    return move(store.financings, store.settlements, payload => ({
      ...payload,
      paidAmount: argument?.paidAmount ?? payload.faceAmount ?? 0,
      paidOn: argument?.paidOn ?? new Date().toISOString().slice(0, 10)
    }));
  }

  return res
    .status(400)
    .json({ errors: [`Unsupported mock exercise ${choice} on ${templateId.entityName}`] });
});

const PORT = process.env.MOCK_JSON_API_PORT || 5757;
app.listen(PORT, () =>
  console.log(`Mock JSON API listening on http://localhost:${PORT}/v1`)
);

