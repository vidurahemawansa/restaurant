"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui";

type Photo = { id: string; url: string; caption: string | null };
type Restaurant = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  photos: Photo[];
};

export function RestaurantProfileForm({ initial }: { initial: Restaurant }) {
  const [restaurant, setRestaurant] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/restaurants/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setRestaurant(data.restaurant);
      setMessage("Profile saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const uploadFile = useCallback(async (file: File, kind: "logo" | "photo") => {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/restaurants/profile/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (kind === "logo" && data.restaurant) {
        setRestaurant(data.restaurant);
      } else if (data.photo) {
        setRestaurant((r) => ({ ...r, photos: [...r.photos, data.photo] }));
      }
      setMessage(kind === "logo" ? "Logo updated" : "Photo added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  async function removePhoto(photoId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/restaurants/profile/photos/${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setRestaurant((r) => ({
        ...r,
        photos: r.photos.filter((p) => p.id !== photoId),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold">Logo</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)]">
            {restaurant.logoUrl ? (
              <Image
                src={restaurant.logoUrl}
                alt="Restaurant logo"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-[var(--muted)]">
                {name.charAt(0) || "R"}
              </span>
            )}
          </div>
          <div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, "logo");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => logoRef.current?.click()}
              className="btn-outline"
            >
              {uploading ? "Uploading…" : "Upload logo"}
            </button>
          </div>
        </div>
      </section>

      <form onSubmit={onSave} className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">Restaurant details</h2>
        <label className="block">
          <Label>Name *</Label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field field-lg w-full"
          />
        </label>
        <label className="block">
          <Label>Address</Label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="field w-full resize-none"
            placeholder="Street, city"
          />
        </label>
        <label className="block">
          <Label>Phone</Label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field w-full"
          />
        </label>
        {error ? <p className="alert alert-error">{error}</p> : null}
        {message ? <p className="alert alert-success">{message}</p> : null}
        <button type="submit" disabled={saving} className="btn-primary btn-lg">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Photos</h2>
          <div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, "photo");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => photoRef.current?.click()}
              className="btn-outline btn-sm"
            >
              Add photo
            </button>
          </div>
        </div>
        {restaurant.photos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Add photos of your restaurant, menu board, or dining area.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {restaurant.photos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[var(--line-soft)]">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Restaurant photo"}
                  width={240}
                  height={180}
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
