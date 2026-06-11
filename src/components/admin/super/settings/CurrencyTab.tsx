import CurrenciesPanel from "./currency/CurrenciesPanel";
import ExchangeRatesPanel from "./currency/ExchangeRatesPanel";

export default function CurrencyTab() {
  return (
    <div className="space-y-6">
      <CurrenciesPanel />
      <ExchangeRatesPanel />
    </div>
  );
}
