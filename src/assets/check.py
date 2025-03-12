# %%
import pandas as pd
import numpy as np

# %%
df = pd.read_json('data_cleaned.json', lines=True)
embeddings = np.load('embeddings.npy')


print(len(df), len(embeddings))
# %%
df.head()

# %%
# drop duplicates from df and embeddings
df.drop_duplicates(subset='fictionId', inplace=True)
embeddings = np.array([embeddings[i] for i in df.index])

# %%
len(df), len(embeddings)

# %%
# write out the cleaned data
df.to_json('data_cleaned_deduped.json', orient='records', lines=True)
np.save('embeddings_deduped.npy', embeddings)
# %%
