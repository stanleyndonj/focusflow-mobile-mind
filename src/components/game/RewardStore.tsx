import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Coins, 
  Palette, 
  Music, 
  Crown, 
  Quote,
  Zap,
  Lock,
  Check,
  Star,
  Sparkles,
  Gift,
  Volume2
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { StoreItem } from '@/types/GameTypes';

interface RewardStoreProps {
  onClose?: () => void;
}

const RewardStore: React.FC<RewardStoreProps> = ({ onClose }) => {
  const { gameStats, storeItems, purchases, purchaseItem: purchaseStoreItem, unlockItem } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  // Store items are managed by GameContext - no local initialization needed
  // The GameContext should already have store items initialized

  const getRarityColor = (rarity: StoreItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      case 'rare': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'epic': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'legendary': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: StoreItem['category']) => {
    switch (category) {
      case 'theme': return <Palette className="w-4 h-4" />;
      case 'sound': return <Volume2 className="w-4 h-4" />;
      case 'companion': return <Crown className="w-4 h-4" />;
      case 'badge': return <Star className="w-4 h-4" />;
      case 'quote': return <Quote className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const purchaseItem = (item: StoreItem) => {
    if (gameStats.coins < item.price || !item.isUnlocked || item.isPurchased) {
      console.log('❌ Purchase failed:', {
        hasEnoughCoins: gameStats.coins >= item.price,
        isUnlocked: item.isUnlocked,
        isPurchased: item.isPurchased,
        currentCoins: gameStats.coins,
        itemPrice: item.price
      });
      return;
    }

    setPurchaseAnimation(item.id);
    
    // Actually purchase the item and deduct coins via GameContext
    setTimeout(() => {
      try {
        purchaseStoreItem(item.id); // This deducts coins and records purchase
        console.log(`✅ Purchased ${item.name} for ${item.price} coins! Remaining: ${gameStats.coins - item.price}`);
      } catch (error) {
        console.error('❌ Failed to purchase item:', error);
      }
      
      setPurchaseAnimation(null);
    }, 1500);
  };

  const filteredItems = selectedCategory === 'all' 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All', icon: <Gift className="w-4 h-4" /> },
    { id: 'theme', name: 'Themes', icon: <Palette className="w-4 h-4" /> },
    { id: 'sound', name: 'Sounds', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'companion', name: 'Companion', icon: <Crown className="w-4 h-4" /> },
    { id: 'badge', name: 'Badges', icon: <Star className="w-4 h-4" /> },
    { id: 'quote', name: 'Quotes', icon: <Quote className="w-4 h-4" /> }
  ];

  const StoreItemCard: React.FC<{ item: StoreItem }> = ({ item }) => {
    const canPurchase = item.isUnlocked && !item.isPurchased && gameStats.coins >= item.price;
    const isLocked = !item.isUnlocked;
    const isPurchased = item.isPurchased;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative"
      >
        <Card className={`transition-all duration-300 ${
          canPurchase ? 'hover:shadow-lg cursor-pointer' : ''
        } ${isLocked ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(item.category)}
                  <div>
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs ${getRarityColor(item.rarity)}`}>
                  {item.rarity}
                </Badge>
              </div>

              {/* Requirements */}
              {item.requirements && isLocked && (
                <div className="text-xs text-muted-foreground">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Requires: 
                  {item.requirements.level && ` Level ${item.requirements.level}`}
                  {item.requirements.questsCompleted && ` ${item.requirements.questsCompleted} Quests`}
                  {item.requirements.streakDays && ` ${item.requirements.streakDays} Day Streak`}
                </div>
              )}

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold">{item.price}</span>
                </div>

                {isPurchased ? (
                  <Badge variant="outline" className="text-green-500 bg-green-500/10">
                    <Check className="w-3 h-3 mr-1" />
                    Owned
                  </Badge>
                ) : isLocked ? (
                  <Button size="sm" disabled>
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Button>
                ) : canPurchase ? (
                  <Button 
                    size="sm" 
                    onClick={() => purchaseItem(item)}
                    disabled={purchaseAnimation === item.id}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    {purchaseAnimation === item.id ? 'Buying...' : 'Buy'}
                  </Button>
                ) : (
                  <Button size="sm" disabled>
                    <Coins className="w-3 h-3 mr-1" />
                    Not enough coins
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Animation */}
        {purchaseAnimation === item.id && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reward Store</h2>
          <p className="text-muted-foreground">Spend your coins on amazing rewards</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Coin Balance */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {gameStats.coins || 0}
            </span>
            <span className="text-muted-foreground">coins</span>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* Store Items */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <StoreItemCard key={item.id} item={item} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No items available in this category</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* How to Earn Coins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            How to Earn Coins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Complete focus sessions</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Finish daily quests</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Maintain streaks</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Level up your companion</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardStore;
