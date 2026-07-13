"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMISSION_RULES = void 0;
exports.getCommission = getCommission;
exports.isReferralMilestoneReached = isReferralMilestoneReached;
exports.getCashbackAmount = getCashbackAmount;
exports.getMilestoneForCount = getMilestoneForCount;
exports.COMMISSION_RULES = {
    referral_placement: {
        event: 'referred_client_places_worker',
        amount: 5,
        description: 'Refer a friend who hires a worker',
    },
    referral_worker_placed: {
        event: 'referred_worker_placed',
        amount: 10,
        description: 'Refer a worker who gets placed',
    },
    referral_grandparent: {
        event: 'referred_referral_placement',
        amount: 2,
        description: 'Your referral referred someone who hired',
    },
    verifier_basic: {
        event: 'verification_completed_basic',
        amount: 3,
        description: 'Basic ID verification completed',
    },
    verifier_full: {
        event: 'verification_completed_full',
        amount: 8,
        description: 'Full Divine Seal verification completed',
    },
    ambassador_share: {
        event: 'network_hire_share',
        amount: 0,
        description: 'Revenue share from network hires (2%)',
        rate: 0.02,
    },
    diaspora_sponsor: {
        event: 'diaspora_referral_monthly',
        amount: 10,
        description: 'Monthly passive income per diaspora referral',
    },
    creator_viral: {
        event: 'content_100k_views',
        amount: 50,
        description: 'Content reaches 100,000 views',
    },
    cashback_refund: {
        event: 'referral_cashback_milestone',
        amount: 0,
        description: 'Cash back on placement fee ($5 per referral)',
    },
};
function getCommission(event, bookingAmount) {
    const rule = exports.COMMISSION_RULES[event];
    if (!rule)
        return { amount: 0, description: 'Unknown commission event' };
    if (rule.rate && bookingAmount) {
        return {
            amount: Math.round(bookingAmount * rule.rate * 100) / 100,
            description: rule.description,
        };
    }
    return { amount: rule.amount, description: rule.description };
}
const CASHBACK_MILESTONES = [1, 2, 5, 10, 20];
function isReferralMilestoneReached(totalReferrals) {
    return CASHBACK_MILESTONES.includes(totalReferrals);
}
function getCashbackAmount(totalReferrals) {
    if (totalReferrals >= 20)
        return 100;
    if (totalReferrals >= 10)
        return 50;
    if (totalReferrals >= 5)
        return 30;
    if (totalReferrals >= 2)
        return 10;
    if (totalReferrals >= 1)
        return 5;
    return 0;
}
function getMilestoneForCount(totalReferrals) {
    if (CASHBACK_MILESTONES.includes(totalReferrals)) {
        return totalReferrals;
    }
    return null;
}
