export default function CatPage() {
  return (
    <div>
      <h1>My Cat</h1>
      <img
        src="/.netlify/functions/get-image" 
        alt="My cute cat"
      />
    </div>
  );
}
