"use client";

import { ChevronDown, Mars, Search, ShoppingCart, Venus } from "lucide-react";

import { symbols } from "@/lib/currency";
import { AUDIENCES, CATEGORIES, type AudienceName } from "./productConstants";
import type { Currency } from "./types";

type ProductsHeaderProps = {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  audience: AudienceName;
  setAudience: (value: AudienceName) => void;
  currency: Currency;
  setCurrency?: (value: Currency) => void;
  cartCount: number;
  onOpenCart: () => void;
};

export default function ProductsHeader({
  search,
  setSearch,
  category,
  setCategory,
  audience,
  setAudience,
  currency,
  setCurrency,
  cartCount,
  onOpenCart,
}: ProductsHeaderProps) {
  const activeCategory =
    CATEGORIES.find((item) => item.name === category) ?? CATEGORIES[0];

  const ActiveCategoryIcon = activeCategory.icon;

  const handleCurrencyChange = (nextCurrency: Currency) => {
    setCurrency?.(nextCurrency);
  };

  return (
    <header className="sticky top-0 z-40 -mx-3 bg-[#080814] px-3 pb-3 pt-3 sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={50}
              autoComplete="off"
              spellCheck={false}
              placeholder="Search products..."
              className="h-12 w-full rounded-full border border-white/[0.06] bg-white/[0.065] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/32 transition-colors duration-200 focus:border-cyan-300/25 focus:bg-white/[0.105]"
            />
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/[0.06] bg-white/[0.065] text-white transition-colors duration-200 active:scale-95 hover:border-fuchsia-400/25 hover:bg-white/[0.12]"
          >
            <ShoppingCart size={19} />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-1 text-[10px] font-black text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <details className="group relative shrink-0">
            <summary className="flex h-12 cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-4 text-sm font-black text-white transition-colors duration-200 active:scale-95 hover:bg-white/[0.11]">
              <span className="text-cyan-100">{symbols[currency]}</span>

              <span className="hidden sm:inline">{currency}</span>

              <ChevronDown
                size={14}
                className="transition-transform duration-200 group-open:rotate-180"
              />
            </summary>

            <div className="absolute right-0 z-50 mt-2 w-28 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#15152b]/96 p-1 backdrop-blur-md">
              {(["USD", "EUR", "GBP"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleCurrencyChange(item)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-white/10 ${
                    currency === item
                      ? "font-black text-white"
                      : "font-semibold text-white/60"
                  }`}
                >
                  <span>{symbols[item]}</span>
                  {item}
                </button>
              ))}
            </div>
          </details>
        </div>

        <div className="hidden items-center justify-between gap-3 lg:flex">
          <div className="flex flex-wrap items-center gap-1.5">
            {AUDIENCES.map(({ name, label, icon: Icon }) => {
              const active = audience === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setAudience(name)}
                  className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-black transition-colors duration-200 active:scale-95 ${
                    active
                      ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white"
                      : "bg-white/[0.035] text-white/55 hover:bg-white/[0.09] hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {CATEGORIES.map(({ name, icon: Icon }) => {
              const active = category === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-black transition-colors duration-200 active:scale-95 ${
                    active
                      ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white"
                      : "bg-white/[0.035] text-white/55 hover:bg-white/[0.09] hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-3 text-xs font-black text-white transition-colors duration-200 active:scale-95 hover:bg-white/[0.10]">
              {audience === "Man" ? (
                <Mars size={16} className="text-cyan-100" />
              ) : (
                <Venus size={16} className="text-cyan-100" />
              )}

              <span>{audience === "All" ? "Woman / Man" : audience}</span>

              <ChevronDown
                size={13}
                className="transition-transform duration-200 group-open:rotate-180"
              />
            </summary>

            <div className="absolute left-0 z-50 mt-2 grid w-[160px] gap-1 rounded-2xl border border-white/[0.06] bg-[#15152b]/96 p-1.5 backdrop-blur-md">
              {AUDIENCES.map(({ name, label, icon: Icon }) => {
                const active = audience === name;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setAudience(name)}
                    className={`flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-black transition-colors duration-200 active:scale-95 ${
                      active
                        ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </details>

          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-3 text-xs font-black text-white transition-colors duration-200 active:scale-95 hover:bg-white/[0.10]">
              <ActiveCategoryIcon size={16} className="text-cyan-100" />

              <span className="truncate">
                {category === "All" ? "All Categories" : category}
              </span>

              <ChevronDown
                size={13}
                className="transition-transform duration-200 group-open:rotate-180"
              />
            </summary>

            <div className="absolute right-0 z-50 mt-2 grid w-[185px] gap-1 rounded-2xl border border-white/[0.06] bg-[#15152b]/96 p-1.5 backdrop-blur-md">
              {CATEGORIES.map(({ name, icon: Icon }) => {
                const active = category === name;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    className={`flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-black transition-colors duration-200 active:scale-95 ${
                      active
                        ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={14} />
                    {name}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
