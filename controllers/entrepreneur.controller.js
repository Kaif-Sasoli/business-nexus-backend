import userModel from '../models/user.model.js'
import entrepreneurModel from '../models/entrepreneurProfile.model.js';


// Create Startup for an existing entrepreneur profile
export const createStartup = async (req, res) => {
  try {
    const { entrepreneurId, startupName, location, industry, foundedAt, totalFunds, overview, team } = req.body;

    if (!entrepreneurId || !startupName) {
      return res.status(400).json({ error: "entrepreneurId (userId) and startupName are required" });
    }

    // Find entrepreneur profile by userId (not entrepreneurId)
    const entrepreneur = await entrepreneurModel.findOne({ userId: entrepreneurId });
    if (!entrepreneur) {
      return res.status(404).json({ error: "Entrepreneur profile not found" });
    }

    // Check if startup already exists
    if (entrepreneur.startups && entrepreneur.startups.startupName) {
      return res.status(400).json({ error: "Startup already exists for this entrepreneur" });
    }

    // Attach startup to profile
    entrepreneur.startups = {
      entrepreneurId: entrepreneur._id,
      startupName,
      location,
      foundedAt,
      totalFunds,
      industry,
      overview,
      team
    };

    await entrepreneur.save();

    res.status(201).json({
      message: "Startup created successfully",
      startup: entrepreneur.startups
    });

  } catch (error) {
    console.error("Error creating startup:", error);
    res.status(500).json({ error: "Failed to create startup" });
  }
};

export const getStartupByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "userId is required" });

    // Find entrepreneur profile by userId and populate user details
    const entrepreneur = await entrepreneurModel
      .findOne({ userId: id })
      .populate('userId', 'name email avatar bio role isOnline  location isEmailVerified');

    if (!entrepreneur) {
      return res.status(404).json({ error: "Entrepreneur profile not found" });
    }

    const startupData = entrepreneur.startups || null;
    const userData = entrepreneur.userId || null;

    return res.status(200).json({ data: { user: userData, startup: startupData }
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Something went wrong", data: null });
  }
};


// Get All Statups
export const getAllEntrepreneursWithStartups = async (req, res) => {
  try {
    const entrepreneurs = await entrepreneurModel
      .find({ startups: { $exists: true, $ne: null } })
      .populate("userId", "name avatar isOnline") 
      .lean();

    if (!entrepreneurs || entrepreneurs.length === 0) {
      return res.status(404).json({ success: false, message: "No entrepreneurs with startups found" });
    }

    const data = entrepreneurs.map(ent => {
      const startup = ent.startups;

      return {
        id: ent.userId?._id.toString() || "", 
        name: ent.userId?.name || "",
        avatarUrl: ent.userId?.avatar || "",
        isOnline: ent.userId?.isOnline || false,

        startupName: startup?.startupName || null,
        industry: startup?.industry || null,
        location: startup?.location || null,

        foundedYear: startup?.foundedAt 
          ? new Date(startup.foundedAt).getFullYear() 
          : null,

        pitchSummary: startup?.overview?.problemStatement || null,

        fundingNeeded: startup?.fundingNeeded || 0,
        totalFunds: startup?.totalFunds || 0,
        teamSize: startup?.team?.length || 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      entrepreneurs: data,
    });
  } catch (err) {
    console.error("Error fetching entrepreneurs with startups:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// Map Funding Ranges to min/max
const mapFundingRange = (range) => {
  switch (range) {
    case '< $500K': return { max: 500000 };
    case '$500K - $1M': return { min: 500000, max: 1000000 };
    case '$1M - $5M': return { min: 1000000, max: 5000000 };
    case '> $5M': return { min: 5000000 };
    default: return {};
  }
};


export const searchEntrepreneurs = async (req, res) => {
  try {
    let {
      searchQuery = "",
      industries = [],
      fundingRanges = [],
      locations = []
    } = req.query;

    if (fundingRanges && !Array.isArray(fundingRanges)) {
      fundingRanges = [fundingRanges];
    }

    const filters = [];

    // Text search
    if (searchQuery.trim()) {
      const regex = new RegExp(searchQuery.trim(), "i");
      filters.push({
        $or: [
          { "userId.name": regex },
          { "startups.startupName": regex },
          { "startups.industry": regex },
          { "startups.location": regex },
          { "startups.overview.problemStatement": regex },
          { "startups.overview.solution": regex },
          { "startups.overview.marketOpportunity": regex },
          { "startups.overview.competitiveAdvantage": regex }
        ]
      });
    }

    if (industries.length > 0) {
      filters.push({ "startups.industry": { $in: industries } });
    }

    if (locations.length > 0) {
      filters.push({ "startups.location": { $in: locations } });
    }

    if (fundingRanges && fundingRanges.length > 0) {
      const orConditions = fundingRanges.map(range => {
        const { min, max } = mapFundingRange(range);
        const cond = {};
        if (min !== undefined) cond.$gte = min;
        if (max !== undefined) cond.$lte = max;
        return { "startups.fundingNeeded": cond };
      });

      filters.push({ $or: orConditions });
    }

    const finalQuery = filters.length > 0 ? { $and: filters } : {};

    const entrepreneurs = await entrepreneurModel
      .find(finalQuery)
      .populate("userId", "name avatar isOnline")
      .lean();

    if (!entrepreneurs || entrepreneurs.length === 0) {
      return res.status(404).json({ success: false, message: "No entrepreneurs found" });
    }

    const formatted = entrepreneurs.map(ent => {
      const startup = ent.startups || {};
      return {
        id: ent.userId?._id.toString() || "",
        name: ent.userId?.name || "",
        avatarUrl: ent.userId?.avatar || "",
        isOnline: ent.userId?.isOnline || false,
        startupName: startup.startupName || null,
        industry: startup.industry || null,
        location: startup.location || null,
        foundedYear: startup.foundedAt ? new Date(startup.foundedAt).getFullYear() : null,
        pitchSummary: startup.overview?.problemStatement || null,
        fundingNeeded: Number(startup.fundingNeeded) || 0,
        totalFunds: Number(startup.totalFunds) || 0,
        teamSize: startup.team?.length || 0
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      results: formatted
    });
  } catch (error) {
    console.error("❌ Error in searchEntrepreneurs:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
