class Project {
  constructor(name, description, mainImage, moreImages, video) {
    this.name = name;
    this.description = description;
    this.mainImage = mainImage;
    this.moreImages = moreImages;
    this.video = video;
  }

  static fromJSON(data) {
    return new Project(
      data.name,
      data.description,
      data['main-image'],
      data['more-images'],
      data.video
    );
  }
}