# data_analyzer.py
import pandas as pd
from typing import List, Tuple

# -----------------------------
# Helpers / Preprocess
# -----------------------------
def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    parts = out["Product_SKU"].astype(str).str.rsplit("-", n=1)
    out["Base_SKU"] = parts.str[0]
    out["Size"] = parts.str[1]  # NaN if no '-'
    out["Size"] = out["Size"].fillna("NA").astype(str).str.strip().str.upper()

    out["Size"] = out["Size"].replace({
        "2XL": "XXL",
        "XXXL": "3XL",
        "XXXXL": "4XL",
        "5XL ": "5XL",
        "L "  : "L",
    })

    if {"Year", "Month"}.issubset(out.columns):
        out["YearMonth"] = pd.to_datetime(
            out["Year"].astype(int).astype(str) + "-" + out["Month"].astype(int).astype(str) + "-01",
            errors="coerce"
        )
    else:
        out["YearMonth"] = pd.NaT

    return out


# -----------------------------
# 1) Historical Sales (grouped bars) — by SKU/Base only
# -----------------------------
def size_mix_pivot(df: pd.DataFrame, sku_or_base: str) -> pd.DataFrame:
    d = preprocess(df)
    base = str(sku_or_base).split("-")[0].strip()

    sub = d.loc[d["Base_SKU"].str.casefold().eq(base.casefold()),
                ["YearMonth", "Size", "Total_quantity"]]
    if sub.empty:
        return pd.DataFrame()

    grouped = sub.groupby(["YearMonth", "Size"], as_index=False)["Total_quantity"].sum()
    pivot = grouped.pivot(index="YearMonth", columns="Size", values="Total_quantity").fillna(0).sort_index()

    pref = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"]
    sizes = [s for s in pref if s in pivot.columns] + [c for c in pivot.columns if c not in pref]
    pivot = pivot.reindex(columns=sizes)
    return pivot


# -----------------------------
# 2) Performance comparison (table, up to 3 SKUs/Base SKUs)
# -----------------------------
def performance_table(df: pd.DataFrame, sku_list: List[str]) -> pd.DataFrame:
    d = preprocess(df).copy()
    d["Product_SKU_u"] = d["Product_SKU"].astype(str).str.strip().str.upper()
    d["Base_SKU_u"]    = d["Base_SKU"].astype(str).str.strip().str.upper()

    tokens = [s.strip().upper() for s in sku_list if s and s.strip()]
    if not tokens:
        return pd.DataFrame(columns=["Item", "Product_name", "Quantity"])

    mask = d["Product_SKU_u"].isin(tokens) | d["Base_SKU_u"].isin(tokens)
    keep = d.loc[mask].copy()
    if keep.empty:
        return pd.DataFrame(columns=["Item", "Product_name", "Quantity"])

    def _name_map(df_in: pd.DataFrame, key: str) -> pd.DataFrame:
        if "Product_name" not in df_in.columns:
            nm = pd.DataFrame(columns=[key, "Product_name"])
        else:
            nm = (df_in.groupby([key, "Product_name"]).size()
                        .reset_index(name="n")
                        .sort_values([key, "n"], ascending=[True, False])
                        .drop_duplicates(key)[[key, "Product_name"]])
        return nm

    wants_sku_level = any("-" in t for t in tokens)

    if wants_sku_level:
        totals = (keep.groupby("Product_SKU", as_index=False)
                       .agg(Quantity=("Total_quantity", "sum")))

        sku_name_map = _name_map(d, "Product_SKU")
        tbl = (totals.merge(sku_name_map, on="Product_SKU", how="left")
                      .rename(columns={"Product_SKU": "Item"})
                      .sort_values("Quantity", ascending=False))
        tbl = tbl[["Item", "Product_name", "Quantity"]]

    else:
        fam = (keep.groupby("Base_SKU", as_index=False)
                    .agg(Quantity=("Total_quantity", "sum")))

        base_name_map = _name_map(d, "Base_SKU")
        tbl = (fam.merge(base_name_map, on="Base_SKU", how="left")
                  .rename(columns={"Base_SKU": "Item"})
                  .sort_values("Quantity", ascending=False))
        tbl = tbl[["Item", "Product_name", "Quantity"]]

    return tbl


# -----------------------------
# 3) Best sellers by month (Top 10) + best size
# -----------------------------
def best_sellers_by_month(df: pd.DataFrame, year: int, month: int, top_n: int = 10) -> pd.DataFrame:
    d = preprocess(df)
    m = d[(d["Year"] == int(year)) & (d["Month"] == int(month))].copy()

    if m.empty:
        return pd.DataFrame(columns=["Base_SKU", "Product_name", "Best_Size", "Quantity"])

    if "Product_name" not in m.columns:
        m["Product_name"] = m["Base_SKU"]
    else:
        if not m["Product_name"].notna().any():
            m["Product_name"] = m["Base_SKU"]

    fam = (m.groupby("Base_SKU", as_index=False)
             .agg(Quantity=("Total_quantity", "sum")))

    size_rank = (m.groupby(["Base_SKU", "Size"], as_index=False)
                   .agg(Size_Qty=("Total_quantity", "sum")))

    best_size = (size_rank.sort_values(["Base_SKU", "Size_Qty"], ascending=[True, False])
                         .groupby("Base_SKU", as_index=False).first()[["Base_SKU", "Size"]]
                         .rename(columns={"Size": "Best_Size"}))

    name_map = (m.groupby(["Base_SKU", "Product_name"]).size()
                  .reset_index(name="n")
                  .sort_values(["Base_SKU", "n"], ascending=[True, False])
                  .drop_duplicates("Base_SKU")[["Base_SKU", "Product_name"]])

    out = (fam.merge(best_size, on="Base_SKU", how="left")
              .merge(name_map, on="Base_SKU", how="left")
              .sort_values("Quantity", ascending=False)
              .head(top_n))

    return out[["Base_SKU", "Product_name", "Best_Size", "Quantity"]]


# -----------------------------
# 4) Total income table (all SKUs) + grand total
# -----------------------------
def total_income_table(df: pd.DataFrame) -> Tuple[pd.DataFrame, float]:
    # KEEP SAME AS BEFORE
    d = preprocess(df).copy()
    monthly = (
        d.groupby(["Product_SKU", "YearMonth"], as_index=False)
         .agg(Revenue_Baht=("Total_Amount(baht)", "sum"))
    )
    per_sku = (
        monthly.groupby("Product_SKU", as_index=False)
               .agg(Total_Revenue_Baht=("Revenue_Baht", "sum"),
                    Avg_Monthly_Revenue_Baht=("Revenue_Baht", "mean"),
                    Months_Active=("Revenue_Baht", "size"))
    )
    if "Product_name" in d.columns:
        name_map = (
            d.groupby(["Product_SKU", "Product_name"]).size()
             .reset_index(name="n")
             .sort_values(["Product_SKU", "n"], ascending=[True, False])
             .drop_duplicates("Product_SKU")[["Product_SKU", "Product_name"]]
        )
        per_sku = per_sku.merge(name_map, on="Product_SKU", how="left")
    else:
        per_sku["Product_name"] = per_sku["Product_SKU"]

    per_sku = (
        per_sku[["Product_SKU", "Product_name", "Months_Active",
                 "Total_Revenue_Baht", "Avg_Monthly_Revenue_Baht"]]
        .sort_values("Total_Revenue_Baht", ascending=False)
        .reset_index(drop=True)
    )

    grand_total = float(per_sku["Total_Revenue_Baht"].sum())
    return per_sku, grand_total
