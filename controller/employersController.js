const SocialLink = require("../models/socialLink")


exports.addSocialProfile = async (req,res) =>{
    const { data } = req.body;

    try {
      // Create a SocialLink object with the user's data
      const socialLink = new SocialLink();
  
      // Group social links by 'selectValue'
      data.forEach(({ selectValue, textValue }) => {
        socialLink[selectValue.toLowerCase()].push({ textValue });
      });
  
      await socialLink.save();
  
      res.status(201).json({ message: 'Data saved successfully', socialLink });
    } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).json({ message : 'Internal server error' });
    }
}