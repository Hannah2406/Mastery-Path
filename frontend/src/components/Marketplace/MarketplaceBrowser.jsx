import { useState, useEffect, useMemo } from 'react';
import { getMarketplacePaths, getMarketplaceTree, importPath, purchasePath, generateAICourse } from '../../api/marketplace';
import { getPaths } from '../../api/paths';
import MarketplaceTreePreview from './MarketplaceTreePreview';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'imports', label: 'Most imported' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

const PRICE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

function CardSkeleton() {
  return (
    <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl p-6 flex flex-col animate-pulse shadow-sm shadow-[#7C5CFF]/5">
      <div className="flex justify-between gap-2 mb-3">
        <div className="h-6 bg-[#E9E7F5] rounded w-3/4" />
        <div className="h-6 w-14 bg-[#E9E7F5] rounded-lg" />
      </div>
      <div className="h-4 bg-[#E9E7F5] rounded w-full mb-2" />
      <div className="h-4 bg-[#E9E7F5] rounded w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-20 bg-[#E9E7F5] rounded-lg" />
        <div className="h-6 w-16 bg-[#E9E7F5] rounded-lg" />
      </div>
      <div className="flex gap-2 mt-auto">
        <div className="h-10 flex-1 bg-[#E9E7F5] rounded-lg" />
        <div className="h-10 flex-1 bg-[#E9E7F5] rounded-lg" />
      </div>
    </div>
  );
}

export default function MarketplaceBrowser({ onClose, onImportPath, onMakeYourOwn }) {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [tag, setTag] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');
  const [priceFilter, setPriceFilter] = useState('');
  const [previewPath, setPreviewPath] = useState(null);
  const [importingId, setImportingId] = useState(null);
  const [purchasingId, setPurchasingId] = useState(null);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('intermediate');
  const [aiTimeMinutes, setAiTimeMinutes] = useState(600);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchPaths = () => {
    setLoading(true);
    setError('');
    const sortParam = sort === 'price_asc' || sort === 'price_desc' ? 'newest' : sort;
    getMarketplacePaths({ tag: tag || undefined, difficulty: difficulty || undefined, sort: sortParam, limit: 50 })
      .then(setPaths)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPaths();
  }, [tag, difficulty, sort]);

  const handleCheckout = (item) => {
    setCheckoutItem(item);
    setError('');
    setPurchaseSuccess(null);
  };

  const handlePlaceOrder = async () => {
    if (!checkoutItem?.id) return;
    setPurchasingId(checkoutItem.id);
    setError('');
    try {
      await purchasePath(checkoutItem.id);
      setPurchaseSuccess(checkoutItem);
      setCheckoutItem(null);
      fetchPaths();
    } catch (err) {
      setError(err.message);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleImportAfterPurchase = async () => {
    if (!purchaseSuccess?.id) return;
    await handleImport(purchaseSuccess.id);
    setPurchaseSuccess(null);
  };

  const handleGenerateAICourse = async () => {
    if (!aiTopic.trim()) {
      setError('Topic is required');
      return;
    }
    setGeneratingAI(true);
    setError('');
    try {
      const result = await generateAICourse({
        topic: aiTopic,
        description: aiDescription || undefined,
        difficulty: aiDifficulty || undefined,
        estimatedTimeMinutes: aiTimeMinutes || undefined,
        priceCents: 0,
        isPaid: false,
      });
      setShowAIGenerate(false);
      setAiTopic('');
      setAiDescription('');
      fetchPaths();
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleImport = async (id) => {
    setImportingId(id);
    setError('');
    try {
      const result = await importPath(id);
      const pathsList = await getPaths();
      const newPath = pathsList.find((p) => p.id === result.pathId) || { id: result.pathId, name: result.pathName };
      onImportPath(newPath);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setImportingId(null);
    }
  };

  const formatPrice = (cents) => {
    if (!cents || cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const isPathPaid = (p) => p?.isPaid === true || p?.paid === true || (p?.priceCents != null && Number(p.priceCents) > 0);
  const hasUserPurchased = (p) => p?.hasPurchased === true;

  const filteredPaths = useMemo(() => {
    let list = paths.filter((p) => {
      const q = (searchDebounced || '').toLowerCase().trim();
      if (q && !(p.title || '').toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q) &&
          !(p.tags || '').toLowerCase().includes(q)) return false;
      if (priceFilter === 'free' && isPathPaid(p)) return false;
      if (priceFilter === 'paid' && !isPathPaid(p)) return false;
      return true;
    });
    if (sort === 'price_asc') list = [...list].sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0));
    if (sort === 'price_desc') list = [...list].sort((a, b) => (b.priceCents ?? 0) - (a.priceCents ?? 0));
    return list;
  }, [paths, searchDebounced, priceFilter, sort]);

  const hasActiveFilters = searchQuery || tag || difficulty || priceFilter || (sort && sort !== 'newest');
  const clearFilters = () => {
    setSearchQuery('');
    setSearchDebounced('');
    setTag('');
    setDifficulty('');
    setPriceFilter('');
    setSort('newest');
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Top bar: Back + Title */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] rounded-xl text-[#1F2937] font-bold text-base transition-colors shadow-sm"
        >
          <span aria-hidden>←</span>
          Back to my paths
        </button>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">Marketplace</h2>
      </div>

      {/* Make your own + AI Generate */}
      <div className="mb-6 flex flex-wrap gap-4">
        {(onMakeYourOwn || onClose) && (
          <div className="flex-1 min-w-[300px] p-5 bg-[#FAFAFF] border border-[#E9E7F5] rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm shadow-[#7C5CFF]/5">
            <div>
              <h3 className="text-[#1F2937] font-bold text-lg mb-0.5">Make your own</h3>
              <p className="text-[#6B7280] text-base font-medium">Publish a path from your library to the marketplace.</p>
            </div>
            <button
              onClick={onMakeYourOwn ?? onClose}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl font-bold text-base transition-colors shadow-md shadow-[#7C5CFF]/20"
            >
              Go to my paths
              <span aria-hidden>→</span>
            </button>
          </div>
        )}
        <div className="flex-1 min-w-[300px] p-5 bg-gradient-to-r from-[#F5F4FF] to-[#E8E4FF] border border-[#7C5CFF]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm shadow-[#7C5CFF]/10">
          <div>
            <h3 className="text-[#1F2937] font-bold text-lg mb-0.5 flex items-center gap-2">
              <span>✨</span> Generate AI Course
            </h3>
            <p className="text-[#6B7280] text-base font-medium">Let AI create a complete learning course for the marketplace.</p>
          </div>
          <button
            onClick={() => setShowAIGenerate(true)}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl font-bold text-base transition-colors shadow-md shadow-[#7C5CFF]/20"
          >
            Generate Course
            <span aria-hidden>✨</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] bg-[#FFFFFF] border border-[#E9E7F5] rounded-xl px-4 py-2.5 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 focus:border-[#7C5CFF]/50 font-medium"
        />
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-xl px-4 py-2.5 text-base font-bold text-[#1F2937] focus:ring-2 focus:ring-[#7C5CFF]/40"
        >
          {PRICE_FILTERS.map((f) => (
            <option key={f.value || 'all'} value={f.value}>{f.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-xl px-4 py-2.5 text-base font-medium text-[#1F2937] placeholder-[#6B7280] w-28 focus:ring-2 focus:ring-[#7C5CFF]/40"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-xl px-4 py-2.5 text-base font-bold text-[#1F2937] focus:ring-2 focus:ring-[#7C5CFF]/40"
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-xl px-4 py-2.5 text-base font-bold text-[#1F2937] focus:ring-2 focus:ring-[#7C5CFF]/40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2.5 text-base font-bold text-[#6B7280] hover:text-[#1F2937] border border-[#E9E7F5] rounded-xl hover:bg-[#FAFAFF] transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] rounded-xl text-base font-semibold flex items-center justify-between gap-4 flex-wrap">
          <span>{error}</span>
          <button onClick={fetchPaths} className="px-4 py-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 rounded-xl font-bold whitespace-nowrap">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="text-center py-16 bg-[#FAFAFF] rounded-2xl border border-[#E9E7F5]">
          <p className="text-[#1F2937] font-bold text-lg">No paths match your filters.</p>
          <p className="text-[#6B7280] text-base font-medium mt-1 mb-4">Try different search terms or clear filters to see all paths.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl font-bold text-base">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <p className="text-[#6B7280] text-base font-bold">
              Showing <span className="text-[#1F2937]">{filteredPaths.length}</span> path{filteredPaths.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPaths.map((p) => {
              const tagsList = (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3);
              return (
                <div
                  key={p.id}
                  className="group bg-[#FFFFFF] border border-[#E9E7F5] hover:border-[#7C5CFF]/40 rounded-2xl p-6 flex flex-col transition-all hover:shadow-xl shadow-sm shadow-[#7C5CFF]/5 hover:shadow-[#7C5CFF]/15"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-extrabold text-[#1F2937] text-xl mb-1 line-clamp-2 flex-1 group-hover:text-[#7C5CFF] transition-colors">
                      {p.title}
                    </h3>
                    <div className="shrink-0 flex items-center gap-1">
                      {isPathPaid(p) && hasUserPurchased(p) && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Owned</span>
                      )}
                      {isPathPaid(p) ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">
                          ${((p.priceCents ?? 0) / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[#6B7280] text-base font-medium mb-3 line-clamp-3 flex-1">{p.description || 'No description'}</p>
                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tagsList.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTag(t)}
                          className="px-2.5 py-1 bg-[#E9E7F5] hover:bg-[#7C5CFF]/20 text-[#4A3F99] text-sm font-bold rounded-lg transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                      p.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      p.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-[#E8E4FF] text-[#4A3F99]'
                    }`}>
                      {p.difficulty}
                    </span>
                    <span className="px-3 py-1.5 bg-[#E9E7F5] text-[#6B7280] rounded-lg text-sm font-bold">
                      {p.nodeCount} nodes
                    </span>
                    {p.estimatedTimeMinutes && (
                      <span className="px-3 py-1.5 bg-[#E9E7F5] text-[#6B7280] rounded-lg text-sm font-bold">
                        {Math.round(p.estimatedTimeMinutes / 60)}h
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#6B7280] font-medium mb-4">
                    <span>{p.importCount} imports</span>
                    {p.authorEmail && <span className="truncate max-w-[120px]">{p.authorEmail}</span>}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setPreviewPath(p)}
                      className="flex-1 py-2.5 px-3 bg-[#FAFAFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] text-[#7C5CFF] rounded-xl text-base font-bold transition-colors hover:border-[#7C5CFF]/50"
                    >
                      Preview
                    </button>
                    {isPathPaid(p) && !hasUserPurchased(p) ? (
                      <button
                        onClick={() => handleCheckout({ id: p.id, title: p.title, priceCents: p.priceCents ?? 0 })}
                        disabled={purchasingId === p.id}
                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {purchasingId === p.id ? '…' : 'Checkout'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleImport(p.id)}
                        disabled={importingId === p.id}
                        className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {importingId === p.id ? 'Importing…' : isPathPaid(p) && hasUserPurchased(p) ? 'Import' : 'Get Free'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Checkout modal */}
      {checkoutItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#E9E7F5]">
              <h3 className="text-xl font-extrabold text-[#1F2937] mb-1">Checkout</h3>
              <p className="text-[#6B7280] text-base font-medium">{checkoutItem.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFF] rounded-xl border border-[#E9E7F5]">
                <span className="text-[#6B7280] font-bold">Total</span>
                <span className="text-2xl font-extrabold text-[#1F2937]">{formatPrice(checkoutItem.priceCents)}</span>
              </div>
              {error && (
                <div className="p-3 bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] rounded-xl text-base font-semibold">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setCheckoutItem(null); setError(''); }}
                  className="flex-1 py-3 border border-[#E9E7F5] rounded-xl text-[#6B7280] hover:bg-[#FAFAFF] font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={purchasingId === checkoutItem.id}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {purchasingId === checkoutItem.id ? 'Processing…' : 'Place order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase success: Import or Back to Marketplace */}
      {purchaseSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-extrabold text-[#1F2937] mb-2">Thank you for your purchase</h3>
              <p className="text-[#6B7280] text-base font-medium mb-6">{purchaseSuccess.title} is now in your library. Import it to start learning.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPurchaseSuccess(null)}
                  className="flex-1 py-3 border border-[#E9E7F5] rounded-xl text-[#6B7280] hover:bg-[#FAFAFF] font-bold transition-colors"
                >
                  Back to Marketplace
                </button>
                <button
                  onClick={handleImportAfterPurchase}
                  disabled={importingId === purchaseSuccess.id}
                  className="flex-1 py-3 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {importingId === purchaseSuccess.id ? 'Importing…' : 'Import to my paths'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewPath && (
        <MarketplaceTreePreview
          marketplacePathId={previewPath.id}
          path={previewPath}
          onClose={() => setPreviewPath(null)}
          onImport={() => { handleImport(previewPath.id); setPreviewPath(null); }}
          onCheckout={() => { handleCheckout({ id: previewPath.id, title: previewPath.title, priceCents: previewPath.priceCents ?? 0 }); setPreviewPath(null); }}
          isPathPaid={isPathPaid(previewPath)}
          hasUserPurchased={hasUserPurchased(previewPath)}
          importingId={importingId}
          purchasingId={purchasingId}
          formatPrice={formatPrice}
        />
      )}

      {/* AI Generate Modal */}
      {showAIGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-extrabold text-[#1F2937] mb-4 flex items-center gap-2">
              <span>✨</span> Generate AI Course
            </h3>
            {error && (
              <div className="mb-4 bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] p-3 rounded-xl text-base font-semibold">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-1">Topic *</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Machine Learning Basics, React Hooks, Python Data Science"
                  className="w-full px-4 py-2.5 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-1">Description (optional)</label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="What should students learn? What level is this for?"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/40 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#1F2937] mb-1">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] font-bold"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1F2937] mb-1">Time (minutes)</label>
                  <input
                    type="number"
                    value={aiTimeMinutes}
                    onChange={(e) => setAiTimeMinutes(parseInt(e.target.value) || 600)}
                    min={60}
                    step={60}
                    className="w-full px-4 py-2.5 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] font-medium"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAIGenerate(false);
                  setError('');
                  setAiTopic('');
                  setAiDescription('');
                }}
                disabled={generatingAI}
                className="flex-1 px-4 py-2.5 bg-[#FAFAFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] text-[#6B7280] rounded-xl font-bold disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAICourse}
                disabled={generatingAI || !aiTopic.trim()}
                className="flex-1 px-4 py-2.5 bg-[#7C5CFF] hover:bg-[#6B4CE6] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {generatingAI ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
