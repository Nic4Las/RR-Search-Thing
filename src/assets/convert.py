# %%
import pandas as pd
import ormsgpack
# %%
df = pd.read_json("data.json", lines=True)
df.head()
# %%
# drop the description_ngram_entropy, description_ngram_entropy_normalized, description_shannon_entropy, description_shannon_entropy_normalized  and description_combined_entropy columns
df = df.drop(columns=['description_ngram_entropy', 'description_ngram_entropy_normalized', 'description_shannon_entropy', 'description_shannon_entropy_normalized', 'description_combined_entropy'])
df.head()
# %%
# rename name to title
df = df.rename(columns={'name': 'title'})

# rename link to url
df = df.rename(columns={'link': 'url'})

# rename updated to lastUpdated
df = df.rename(columns={'updated': 'lastUpdated'})

# %%
df.head()
# %%
df.to_json("data_cleaned.json", orient='records', lines=True)
# %%

with open("data_cleaned.msgpack", "wb") as f:
    f.write(ormsgpack.packb(df.to_dict(orient='records')))

# %%
